import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { existencia } from '@/entities/lote'
import { costoReceta } from '@/entities/receta'
import { byId } from '@/shared/lib'
import { aplicarVenta, sembrarVentasAplicadas } from './api'
import { explotarVenta } from './model'

const pendiente = () => db.ventas.find((v) => !v.aplicada)!
const totalDe = (insumoId: string) => existencia(db.lotes, insumoId).total

describe('aplicarVenta', () => {
  it('descuenta del inventario cada insumo que explota la receta', async () => {
    const venta = pendiente()
    const consumo = explotarVenta(venta, byId(db.recetas))
    const antes = Object.fromEntries(Object.keys(consumo).map((id) => [id, totalDe(id)]))

    await aplicarVenta(venta.id)

    for (const [insumoId, cantidad] of Object.entries(consumo)) {
      expect(totalDe(insumoId)).toBeCloseTo(antes[insumoId] - cantidad, 4)
    }
  })

  it('marca la venta como aplicada', async () => {
    const { venta } = await aplicarVenta(pendiente().id)
    expect(venta.aplicada).toBe(true)
  })

  it('es idempotente: reenviar la misma venta no descuenta dos veces (RF-INT-02)', async () => {
    const venta = pendiente()
    const insumoId = Object.keys(explotarVenta(venta, byId(db.recetas)))[0]

    await aplicarVenta(venta.id)
    const despuesDeLaPrimera = totalDe(insumoId)

    const segunda = await aplicarVenta(venta.id)
    expect(segunda.faltantes).toEqual([])
    expect(totalDe(insumoId)).toBe(despuesDeLaPrimera)
  })

  it('asienta un movimiento de venta por cada lote tocado', async () => {
    const venta = pendiente()
    const antes = db.movimientos.length

    await aplicarVenta(venta.id)

    const nuevos = db.movimientos.slice(0, db.movimientos.length - antes)
    expect(nuevos.length).toBeGreaterThan(0)
    expect(nuevos.every((m) => m.tipo === 'venta' && m.ref === venta.folio)).toBe(true)
    expect(nuevos.every((m) => m.cantidad < 0)).toBe(true)
  })

  it('con existencia insuficiente deja el lote abierto en negativo y alerta (RF-ERP-13)', async () => {
    const venta = pendiente()
    const consumo = explotarVenta(venta, byId(db.recetas))
    const [insumoId, cantidad] = Object.entries(consumo)[0]

    // Se deja una gota en el lote abierto más viejo y se vacían los demás: alcanza para
    // que exista dónde cargar el sobrante, pero no para cubrir la venta.
    const abiertos = db.lotes.filter((l) => l.insumoId === insumoId && l.estado === 'abierta')
    abiertos.forEach((l, i) => (l.restante = i === 0 ? 1 : 0))

    const { faltantes } = await aplicarVenta(venta.id)

    expect(faltantes.find((f) => f.insumoId === insumoId)?.cantidad).toBeCloseTo(cantidad - 1, 4)
    expect(existencia(db.lotes, insumoId).abierto).toBeLessThan(0)
  })

  it('sin ningún lote abierto no inventa dónde descontar, pero deja constancia', async () => {
    const venta = pendiente()
    const consumo = explotarVenta(venta, byId(db.recetas))
    const [insumoId, cantidad] = Object.entries(consumo)[0]

    for (const lote of db.lotes) {
      if (lote.insumoId === insumoId && lote.estado === 'abierta') lote.estado = 'agotada'
    }
    const abiertoAntes = existencia(db.lotes, insumoId).abierto

    const { faltantes } = await aplicarVenta(venta.id)

    expect(faltantes.find((f) => f.insumoId === insumoId)?.cantidad).toBeCloseTo(cantidad, 4)
    expect(existencia(db.lotes, insumoId).abierto).toBe(abiertoAntes)
    expect(
      db.movimientos.some((m) => m.insumoId === insumoId && !m.loteId && m.ref === venta.folio),
    ).toBe(true)
  })

  it('revienta con una venta que no existe en vez de fallar en silencio', async () => {
    await expect(aplicarVenta('no-existe')).rejects.toThrow(/Venta desconocida/)
  })
})

describe('sembrarVentasAplicadas', () => {
  it('deja el kardex coherente con las ventas que la semilla marca como aplicadas', () => {
    const yaAplicadas = db.ventas.filter((v) => v.aplicada)
    expect(yaAplicadas.length).toBeGreaterThan(0)
    expect(db.movimientos.some((m) => m.tipo === 'venta')).toBe(false)

    sembrarVentasAplicadas()

    expect(db.ventas.filter((v) => v.aplicada)).toHaveLength(yaAplicadas.length)
    for (const venta of yaAplicadas) {
      expect(db.movimientos.some((m) => m.ref === venta.folio)).toBe(true)
    }
  })

  it('es idempotente: una segunda corrida no vuelve a descontar', () => {
    sembrarVentasAplicadas()
    const movimientos = db.movimientos.length
    const lotes = db.lotes.map((l) => l.restante)

    sembrarVentasAplicadas()

    expect(db.movimientos.length).toBe(movimientos)
    expect(db.lotes.map((l) => l.restante)).toEqual(lotes)
  })
})

describe('costo de la venta', () => {
  it('el consumo explotado cuesta lo mismo que sumar el costo de cada receta vendida', () => {
    const insumos = byId(db.insumos)
    const venta = pendiente()

    const porExplosion = Object.entries(explotarVenta(venta, byId(db.recetas))).reduce(
      (s, [insumoId, qty]) => s + qty * insumos[insumoId].costoUnitario,
      0,
    )
    const porReceta = venta.lineas.reduce((s, linea) => {
      const receta = db.recetas.find((r) => r.id === linea.refId)!
      return s + costoReceta(receta, insumos) * linea.cantidad
    }, 0)

    expect(porExplosion).toBeCloseTo(porReceta, 6)
  })
})
