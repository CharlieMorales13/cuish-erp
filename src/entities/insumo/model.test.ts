import { describe, expect, it } from 'vitest'
import type { Existencia, Insumo } from '@/shared/api/contracts'
import { bajoMinimo, costoUnitario, estadoExistencia, rendimiento, valorInventario } from './model'

const insumo = (p: Partial<Insumo> = {}): Insumo => ({
  id: 'INS-01',
  nombre: 'Mezcal',
  categoria: 'Destilados',
  presentacion: 1000,
  unidad: 'ml',
  costoCompra: 150,
  costoUnitario: 0.15,
  esBotella: true,
  caduca: false,
  min: 1500,
  max: 6000,
  ...p,
})

const ex = (total: number): Existencia => ({
  insumoId: 'INS-01',
  cerrado: 0,
  abierto: total,
  total,
})

describe('estadoExistencia', () => {
  it.each([
    [0, 'Agotado'],
    [-120, 'Agotado'],
    [1499, 'Bajo mínimo'],
    [1500, 'En rango'],
    [6000, 'En rango'],
    [6001, 'Sobre máximo'],
  ])('con %d de existencia el estado es %s', (total, esperado) => {
    expect(estadoExistencia(total, insumo())).toBe(esperado)
  })
})

describe('bajoMinimo', () => {
  it('es falso sin dato de existencia', () => {
    expect(bajoMinimo(undefined, insumo())).toBe(false)
  })

  it('el mínimo exacto todavía no es bajo mínimo', () => {
    expect(bajoMinimo(ex(1500), insumo())).toBe(false)
    expect(bajoMinimo(ex(1499), insumo())).toBe(true)
  })
})

describe('costoUnitario', () => {
  it('deriva el costo por unidad de la presentación de compra', () => {
    expect(costoUnitario(150, 1000)).toBe(0.15)
  })

  it('da cero con presentación cero, en vez de Infinity', () => {
    expect(costoUnitario(150, 0)).toBe(0)
  })
})

describe('valorInventario', () => {
  it('valúa a costo de reposición', () => {
    const insumos = [insumo(), insumo({ id: 'INS-02', costoUnitario: 0.89 })]
    const existencias = {
      'INS-01': ex(1000),
      'INS-02': { insumoId: 'INS-02', cerrado: 0, abierto: 100, total: 100 },
    }
    expect(valorInventario(insumos, existencias)).toBeCloseTo(150 + 89, 6)
  })

  it('trata como cero un insumo sin existencia registrada', () => {
    expect(valorInventario([insumo()], {})).toBe(0)
  })
})

describe('rendimiento', () => {
  it('dice cuántos caballitos salen de una botella', () => {
    // 1,000 ml de mezcal a 45 ml por caballito
    expect(rendimiento(1000, 45)).toBeCloseTo(22.22, 2)
  })

  it('una botella de 750 rinde menos', () => {
    expect(rendimiento(750, 45)).toBeCloseTo(16.67, 2)
  })

  it('da cero si no hay medida de servicio, en vez de Infinity', () => {
    expect(rendimiento(1000, 0)).toBe(0)
  })
})
