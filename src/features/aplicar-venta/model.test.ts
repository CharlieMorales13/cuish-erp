import { describe, expect, it } from 'vitest'
import { byId } from '@/shared/lib'
import { RECETAS } from '@/shared/api/seed/recetas'
import type { Venta } from '@/shared/api/contracts'
import { explotarVenta } from './model'

const recetas = byId(RECETAS)

const venta = (lineas: Venta['lineas']): Venta => ({
  id: 'v1',
  folio: 'V-1',
  fecha: '2026-01-01T20:00:00',
  cuenta: 'Barra 1',
  lineas,
  total: 0,
  aplicada: false,
})

describe('explotarVenta', () => {
  it('suma los ingredientes de varias recetas que comparten insumo', () => {
    const consumo = explotarVenta(
      venta([
        // Paloma con espadín (60 ml) y Cozana con espadín (60 ml): comparten el mezcal
        { tipo: 'receta', refId: 'REC-27', cantidad: 2, precio: 0 },
        { tipo: 'receta', refId: 'REC-15', cantidad: 1, precio: 0 },
      ]),
      recetas,
    )
    expect(consumo['INS-01']).toBe(180)
    expect(consumo['INS-22']).toBe(180 * 2 + 150) // hielo de dos palomas y una cozana
  })

  it('multiplica por la cantidad de la línea', () => {
    const uno = explotarVenta(
      venta([{ tipo: 'receta', refId: 'REC-21', cantidad: 1, precio: 0 }]),
      recetas,
    )
    const tres = explotarVenta(
      venta([{ tipo: 'receta', refId: 'REC-21', cantidad: 3, precio: 0 }]),
      recetas,
    )
    for (const insumoId of Object.keys(uno)) {
      expect(tres[insumoId]).toBeCloseTo(uno[insumoId] * 3, 6)
    }
  })

  it('un insumo vendido directo (mezcal en copeo) no pasa por receta', () => {
    const consumo = explotarVenta(
      venta([{ tipo: 'insumo', refId: 'INS-01', cantidad: 45, precio: 0 }]),
      recetas,
    )
    expect(consumo).toEqual({ 'INS-01': 45 })
  })

  it('ignora una receta que ya no existe en vez de reventar el cierre de cuenta', () => {
    const consumo = explotarVenta(
      venta([
        { tipo: 'receta', refId: 'BORRADA', cantidad: 1, precio: 0 },
        { tipo: 'insumo', refId: 'INS-01', cantidad: 45, precio: 0 },
      ]),
      recetas,
    )
    expect(consumo).toEqual({ 'INS-01': 45 })
  })

  it('un ticket vacío no consume nada', () => {
    expect(explotarVenta(venta([]), recetas)).toEqual({})
  })
})
