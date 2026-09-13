import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { byId } from '@/shared/lib'
import { existencia } from '@/entities/lote'
import { explotarVenta } from '@/features/aplicar-venta'
import { renderConProviders, screen, userEvent, waitFor, within } from '@/shared/test/render'
import VentasPage from './index'

const pendientes = () => db.ventas.filter((v) => !v.aplicada)

describe('<VentasPage>', () => {
  it('lista los tickets recibidos del POS con su UUID', async () => {
    renderConProviders(<VentasPage />)
    const venta = db.ventas[0]

    expect(await screen.findByText(venta.folio)).toBeInTheDocument()
    expect(screen.getByText(`uuid ${venta.id}`)).toBeInTheDocument()
  })

  it('distingue las ya aplicadas de las pendientes', async () => {
    renderConProviders(<VentasPage />)

    expect(await screen.findAllByText('pendiente')).toHaveLength(pendientes().length)
    expect(screen.getAllByText('inventario aplicado')).toHaveLength(
      db.ventas.length - pendientes().length,
    )
  })

  it('aplicar una venta descuenta su consumo del inventario', async () => {
    const user = userEvent.setup()
    const venta = pendientes()[0]
    const consumo = explotarVenta(venta, byId(db.recetas))
    const [insumoId, cantidad] = Object.entries(consumo)[0]
    const antes = existencia(db.lotes, insumoId).total

    renderConProviders(<VentasPage />)
    const botones = await screen.findAllByRole('button', { name: 'Aplicar al inventario' })
    await user.click(botones[0])

    await screen.findByText(`Aplicar ${pendientes().length} pendientes`)
    expect(existencia(db.lotes, insumoId).total).toBeCloseTo(antes - cantidad, 4)
  })

  it('aplicar todas deja la lista sin pendientes', async () => {
    const user = userEvent.setup()
    renderConProviders(<VentasPage />)

    const boton = await screen.findByRole('button', { name: /Aplicar \d+ pendientes/ })
    await user.click(boton)

    // Las aplica una por una, así que hay que esperar a que caiga la última.
    await waitFor(
      () => expect(screen.getAllByText('inventario aplicado')).toHaveLength(db.ventas.length),
      { timeout: 5000 },
    )
    expect(screen.queryByText('pendiente')).not.toBeInTheDocument()
  })

  it('alerta el faltante sin bloquear cuando no alcanza la existencia (RF-ERP-13)', async () => {
    const user = userEvent.setup()
    const venta = pendientes()[0]
    const [insumoId] = Object.keys(explotarVenta(venta, byId(db.recetas)))
    for (const lote of db.lotes) {
      if (lote.insumoId === insumoId && lote.estado === 'abierta') lote.estado = 'agotada'
    }

    renderConProviders(<VentasPage />)
    const botones = await screen.findAllByRole('button', { name: 'Aplicar al inventario' })
    await user.click(botones[0])

    const nombre = db.insumos.find((i) => i.id === insumoId)!.nombre
    expect(
      await screen.findByText(new RegExp(`existencia insuficiente[\\s\\S]*${nombre}`)),
    ).toBeInTheDocument()
    // el ticket igual quedó aplicado: la alerta informa, no bloquea
    expect(screen.getAllByText('inventario aplicado').length).toBeGreaterThan(0)
  })

  it('el detalle del ticket muestra la explosión a insumos', async () => {
    const user = userEvent.setup()
    const venta = db.ventas[0]

    renderConProviders(<VentasPage />)
    await user.click(await screen.findByText(venta.folio))

    const dialogo = await screen.findByRole('dialog', { name: `Ticket ${venta.folio}` })
    const consumo = explotarVenta(venta, byId(db.recetas))
    const primerInsumo = db.insumos.find((i) => i.id === Object.keys(consumo)[0])!

    expect(within(dialogo).getByRole('table', { name: 'Consumo de inventario' })).toHaveTextContent(
      primerInsumo.nombre,
    )
  })
})
