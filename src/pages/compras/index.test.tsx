import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { existencia } from '@/entities/lote'
import { renderConProviders, screen, userEvent, waitFor, within } from '@/shared/test/render'
import ComprasPage from './index'

const tarjetaDe = async (folio: string) =>
  (await screen.findByText(folio)).closest('div.rounded-lg') as HTMLElement

describe('<ComprasPage>', () => {
  it('avisa cuántos envases están prestados sin devolver', async () => {
    renderConProviders(<ComprasPage />)
    expect(await screen.findByText(/prestados sin devolver/)).toHaveTextContent('10 envases')
  })

  it('solo ofrece recibir las requisiciones, no lo ya recibido', async () => {
    renderConProviders(<ComprasPage />)
    const requisiciones = db.compras.filter((c) => c.estado === 'requisicion').length
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Recibir mercancía' })).toHaveLength(
        requisiciones,
      ),
    )
  })

  it('recibir una requisición crea el inventario de sus partidas', async () => {
    const user = userEvent.setup()
    const requisicion = db.compras.find((c) => c.estado === 'requisicion')!
    const linea = requisicion.lineas[0]
    const insumo = db.insumos.find((i) => i.id === linea.insumoId)!
    const antes = existencia(db.lotes, insumo.id).total

    renderConProviders(<ComprasPage />)
    const tarjeta = await tarjetaDe(requisicion.folio)
    await user.click(within(tarjeta).getByRole('button', { name: 'Recibir mercancía' }))

    await waitFor(() =>
      expect(existencia(db.lotes, insumo.id).total).toBeCloseTo(
        antes + linea.presentaciones * insumo.presentacion,
        4,
      ),
    )
  })

  it('devolver cascos baja el adeudo del proveedor', async () => {
    const user = userEvent.setup()
    renderConProviders(<ComprasPage />)

    await user.click(await screen.findByRole('button', { name: /Devolver 10 cascos/ }))

    await waitFor(() =>
      expect(db.compras.find((c) => c.id === 'CMP-001')!.cascosDevueltos).toBe(10),
    )
  })

  it('muestra cuánto entra al almacén por cada partida, ya convertido', async () => {
    renderConProviders(<ComprasPage />)
    const tarjeta = await tarjetaDe('CMP-001')
    // 12 botellas de IPA de 1 L, que se almacenan por pieza
    expect(within(tarjeta).getByText('12 pz')).toBeInTheDocument()
  })
})
