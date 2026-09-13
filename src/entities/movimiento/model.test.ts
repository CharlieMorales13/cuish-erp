import { describe, expect, it } from 'vitest'
import { acumularPorInsumo, cantidadMerma } from './model'

describe('cantidadMerma', () => {
  it('convierte porcentaje de existencia a cantidad', () => {
    expect(cantidadMerma(1000, 2.5)).toBe(25)
  })

  it('cero por ciento no merma nada', () => {
    expect(cantidadMerma(1000, 0)).toBe(0)
  })
})

describe('acumularPorInsumo', () => {
  const movimientos = [
    { tipo: 'venta' as const, insumoId: 'INS-01', cantidad: -45 },
    { tipo: 'venta' as const, insumoId: 'INS-01', cantidad: -30 },
    { tipo: 'venta' as const, insumoId: 'INS-02', cantidad: -60 },
    { tipo: 'merma' as const, insumoId: 'INS-01', cantidad: -10 },
    { tipo: 'entrada' as const, insumoId: 'INS-01', cantidad: 1000 },
  ]

  it('suma solo el tipo pedido y devuelve el consumo en positivo', () => {
    expect(acumularPorInsumo(movimientos, 'venta')).toEqual({ 'INS-01': 75, 'INS-02': 60 })
  })

  it('separa merma de consumo', () => {
    expect(acumularPorInsumo(movimientos, 'merma')).toEqual({ 'INS-01': 10 })
  })

  it('devuelve vacío cuando no hay movimientos de ese tipo', () => {
    expect(acumularPorInsumo(movimientos, 'conteo')).toEqual({})
  })
})
