import { describe, expect, it } from 'vitest'
import type { Lote } from '@/shared/api/contracts'
import { afectarLote, consumirPeps, existencia, existencias } from './model'

const lote = (p: Partial<Lote> & Pick<Lote, 'id' | 'insumoId'>): Lote => ({
  estado: 'abierta',
  restante: 750,
  inicial: 750,
  recibido: '2026-01-01',
  costoUnitario: 1,
  ...p,
})

describe('existencia', () => {
  it('separa botella cerrada de botella abierta', () => {
    const lotes = [
      lote({ id: 'L1', insumoId: 'INS-01', estado: 'cerrada', restante: 1000 }),
      lote({ id: 'L2', insumoId: 'INS-01', estado: 'cerrada', restante: 1000 }),
      lote({ id: 'L3', insumoId: 'INS-01', estado: 'abierta', restante: 420 }),
      lote({ id: 'L4', insumoId: 'INS-01', estado: 'agotada', restante: 0 }),
      lote({ id: 'L5', insumoId: 'INS-02', estado: 'abierta', restante: 700 }),
    ]
    expect(existencia(lotes, 'INS-01')).toEqual({
      insumoId: 'INS-01',
      cerrado: 2000,
      abierto: 420,
      total: 2420,
    })
  })

  it('no esconde el negativo de un lote que se agotó vendiendo sin existencia', () => {
    const lotes = [lote({ id: 'L1', insumoId: 'INS-01', estado: 'agotada', restante: -120 })]
    expect(existencia(lotes, 'INS-01').total).toBe(-120)
  })

  it('da cero para un insumo sin lotes', () => {
    expect(existencia([], 'INS-99')).toEqual({
      insumoId: 'INS-99',
      cerrado: 0,
      abierto: 0,
      total: 0,
    })
  })
})

describe('existencias', () => {
  it('devuelve una entrada por insumo pedido, aunque no tenga lotes', () => {
    const lotes = [lote({ id: 'L1', insumoId: 'INS-01', restante: 100 })]
    expect(existencias(lotes, ['INS-01', 'INS-02'])).toEqual({
      'INS-01': { insumoId: 'INS-01', cerrado: 0, abierto: 100, total: 100 },
      'INS-02': { insumoId: 'INS-02', cerrado: 0, abierto: 0, total: 0 },
    })
  })
})

describe('consumirPeps', () => {
  const lotes = () => [
    lote({ id: 'L-viejo', insumoId: 'INS-01', restante: 100, recibido: '2026-01-01' }),
    lote({ id: 'L-nuevo', insumoId: 'INS-01', restante: 500, recibido: '2026-02-01' }),
    lote({
      id: 'L-cerrado',
      insumoId: 'INS-01',
      estado: 'cerrada',
      restante: 1000,
      recibido: '2025-01-01',
    }),
  ]

  it('agota el lote más viejo antes de tocar el siguiente', () => {
    expect(consumirPeps(lotes(), 'INS-01', 250)).toEqual({
      asignaciones: [
        { loteId: 'L-viejo', cantidad: 100 },
        { loteId: 'L-nuevo', cantidad: 150 },
      ],
      faltante: 0,
    })
  })

  it('nunca consume de una botella cerrada, aunque sea la más vieja', () => {
    const { asignaciones } = consumirPeps(lotes(), 'INS-01', 600)
    expect(asignaciones.map((a) => a.loteId)).not.toContain('L-cerrado')
  })

  it('reporta faltante sin bloquear, cargándolo al lote más viejo', () => {
    const r = consumirPeps(lotes(), 'INS-01', 800)
    expect(r.faltante).toBe(200)
    expect(r.asignaciones.reduce((s, a) => s + a.cantidad, 0)).toBe(800)
  })

  it('sin lotes abiertos no asigna nada pero reporta el faltante completo', () => {
    expect(consumirPeps(lotes(), 'INS-09', 60)).toEqual({ asignaciones: [], faltante: 60 })
  })

  it('no asigna nada cuando el consumo es cero', () => {
    expect(consumirPeps(lotes(), 'INS-01', 0)).toEqual({ asignaciones: [], faltante: 0 })
  })
})

describe('afectarLote', () => {
  it('marca agotado un lote abierto que llega a cero', () => {
    const l = lote({ id: 'L1', insumoId: 'INS-01', restante: 50 })
    afectarLote(l, -50)
    expect(l).toMatchObject({ restante: 0, estado: 'agotada' })
  })

  it('deja cerrada una botella cerrada aunque llegue a cero', () => {
    const l = lote({ id: 'L1', insumoId: 'INS-01', estado: 'cerrada', restante: 0 })
    afectarLote(l, 0)
    expect(l.estado).toBe('cerrada')
  })

  it('redondea a 4 decimales para no arrastrar error de punto flotante', () => {
    const l = lote({ id: 'L1', insumoId: 'INS-01', restante: 0.3 })
    afectarLote(l, -0.1)
    expect(l.restante).toBe(0.2)
  })
})
