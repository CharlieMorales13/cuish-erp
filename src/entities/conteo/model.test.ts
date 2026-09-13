import { describe, expect, it } from 'vitest'
import type { LineaConteo } from '@/shared/api/contracts'
import { avance, capturadas, conDiferencia, diferencia, impactoValor } from './model'

const lineas: LineaConteo[] = [
  { insumoId: 'INS-01', teorico: 1000, fisico: 950 },
  { insumoId: 'INS-02', teorico: 500, fisico: 500 },
  { insumoId: 'INS-03', teorico: 200, fisico: 260 },
  { insumoId: 'INS-04', teorico: 100, fisico: null },
]

describe('diferencia', () => {
  it('es null mientras no se capture el físico', () => {
    expect(diferencia({ insumoId: 'X', teorico: 100, fisico: null })).toBeNull()
  })

  it('un físico de cero es una diferencia real, no un dato faltante', () => {
    expect(diferencia({ insumoId: 'X', teorico: 100, fisico: 0 })).toBe(-100)
  })

  it('redondea a 4 decimales', () => {
    expect(diferencia({ insumoId: 'X', teorico: 0.1, fisico: 0.3 })).toBe(0.2)
  })
})

describe('capturadas y conDiferencia', () => {
  it('capturadas cuenta solo las que ya tienen físico', () => {
    expect(capturadas(lineas)).toHaveLength(3)
  })

  it('conDiferencia deja fuera las que cuadran y las no capturadas', () => {
    expect(conDiferencia(lineas).map((l) => l.insumoId)).toEqual(['INS-01', 'INS-03'])
  })
})

describe('impactoValor', () => {
  it('valúa faltantes y sobrantes al costo de cada insumo', () => {
    const costo = (id: string) => ({ 'INS-01': 0.15, 'INS-03': 0.5 })[id] ?? 0
    // faltan 50 a $0.15 y sobran 60 a $0.50
    expect(impactoValor(lineas, costo)).toBeCloseTo(-50 * 0.15 + 60 * 0.5, 6)
  })
})

describe('avance', () => {
  it('muestra capturadas sobre total', () => {
    expect(avance({ id: 'C', folio: 'C', fecha: '', estado: 'abierto', lineas })).toBe('3 / 4')
  })
})
