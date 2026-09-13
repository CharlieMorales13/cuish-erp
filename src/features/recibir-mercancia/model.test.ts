import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { existencia } from '@/entities/lote'
import type { Insumo } from '@/shared/api/contracts'
import { ingresar, piezasDeCompra } from './model'

const insumo = (id: string) => db.insumos.find((i) => i.id === id) as Insumo

describe('piezasDeCompra', () => {
  it('por pieza entra lo que se captura', () => {
    expect(piezasDeCompra(6, 'pieza', 24)).toBe(6)
  })

  it('por caja multiplica por las piezas de la caja (RF-ERP-07)', () => {
    expect(piezasDeCompra(2, 'caja', 24)).toBe(48)
  })

  it('sin piezas por caja definidas, una caja no puede convertirse', () => {
    expect(piezasDeCompra(2, 'caja', undefined)).toBe(2)
  })
})

describe('ingresar', () => {
  it('crea una partida cerrada por cada botella', () => {
    const mezcal = insumo('INS-01')
    const lotes = ingresar(mezcal, 3, mezcal.costoCompra)

    expect(lotes).toHaveLength(3)
    expect(lotes.every((l) => l.estado === 'cerrada')).toBe(true)
    expect(lotes.every((l) => l.restante === mezcal.presentacion)).toBe(true)
  })

  it('lo que no es botella entra como una sola partida abierta, ya convertida', () => {
    const hielo = insumo('INS-17')
    const lotes = ingresar(hielo, 4, hielo.costoCompra)

    expect(lotes).toHaveLength(1)
    expect(lotes[0].estado).toBe('abierta')
    expect(lotes[0].restante).toBe(4 * hielo.presentacion)
  })

  it('solo asigna marbete cuando entra una sola botella, porque es único por botella', () => {
    const mezcal = insumo('INS-01')
    expect(ingresar(mezcal, 1, mezcal.costoCompra, { marbete: 'M1' })[0].marbete).toBe('M1')
    expect(
      ingresar(mezcal, 2, mezcal.costoCompra, { marbete: 'M1' }).every((l) => !l.marbete),
    ).toBe(true)
  })

  it('ignora la caducidad de un insumo que no caduca', () => {
    const mezcal = insumo('INS-01')
    expect(mezcal.caduca).toBe(false)
    expect(
      ingresar(mezcal, 1, mezcal.costoCompra, { caducidad: '2027-01-01' })[0].caducidad,
    ).toBeUndefined()
  })

  it('guarda la caducidad de un insumo que sí caduca', () => {
    const jarabe = insumo('INS-24')
    expect(ingresar(jarabe, 1, jarabe.costoCompra, { caducidad: '2027-01-01' })[0].caducidad).toBe(
      '2027-01-01',
    )
  })

  it('deriva el costo unitario de la presentación, no lo copia del costo de compra', () => {
    const mezcal = insumo('INS-01')
    expect(ingresar(mezcal, 1, 200)[0].costoUnitario).toBeCloseTo(200 / mezcal.presentacion, 6)
  })

  it('sube la existencia y asienta un movimiento de entrada por lote', () => {
    const mezcal = insumo('INS-01')
    const antes = existencia(db.lotes, mezcal.id).total
    const movimientos = db.movimientos.length

    ingresar(mezcal, 2, mezcal.costoCompra, { ref: 'CMP-9' })

    expect(existencia(db.lotes, mezcal.id).total).toBeCloseTo(antes + 2 * mezcal.presentacion, 4)
    const nuevos = db.movimientos.slice(0, db.movimientos.length - movimientos)
    expect(nuevos).toHaveLength(2)
    expect(nuevos.every((m) => m.tipo === 'entrada' && m.ref === 'CMP-9')).toBe(true)
  })
})
