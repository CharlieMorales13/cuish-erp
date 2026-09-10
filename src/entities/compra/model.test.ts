import { describe, expect, it } from 'vitest'
import type { Compra } from '@/shared/api/contracts'
import { cascosPendientes, cascosVivos, totalCompra } from './model'

const compra = (p: Partial<Compra> = {}): Compra => ({
  id: 'CMP-1',
  folio: 'CMP-1',
  proveedorId: 'PRV-1',
  fecha: '2026-01-01',
  estado: 'recibida',
  lineas: [],
  cascosPrestados: 0,
  cascosDevueltos: 0,
  ...p,
})

describe('totalCompra', () => {
  it('multiplica presentaciones por costo de cada partida', () => {
    expect(
      totalCompra([
        { insumoId: 'INS-01', presentaciones: 6, costoCompra: 150 },
        { insumoId: 'INS-19', presentaciones: 24, costoCompra: 13.33 },
      ]),
    ).toBeCloseTo(900 + 319.92, 6)
  })

  it('una requisición vacía vale cero', () => {
    expect(totalCompra([])).toBe(0)
  })
})

describe('cascos', () => {
  it('pendientes son los prestados menos los devueltos', () => {
    expect(cascosPendientes(compra({ cascosPrestados: 10, cascosDevueltos: 4 }))).toBe(6)
  })

  it('una requisición sin recibir todavía no presta envases', () => {
    const compras = [
      compra({ estado: 'requisicion', cascosPrestados: 10 }),
      compra({ id: 'CMP-2', estado: 'recibida', cascosPrestados: 10, cascosDevueltos: 3 }),
    ]
    expect(cascosVivos(compras)).toBe(7)
  })
})
