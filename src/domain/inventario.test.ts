import { describe, expect, it } from 'vitest'
import { INSUMOS } from '../data/insumos'
import { RECETAS } from '../data/recetas'
import {
  byId, cantidadMerma, consumirPeps, costoReceta, existencia, explotarVenta,
} from './inventario'
import type { Lote, Venta } from './types'

const insumos = byId(INSUMOS)
const recetas = byId(RECETAS)

const lote = (p: Partial<Lote> & Pick<Lote, 'id' | 'insumoId'>): Lote => ({
  estado: 'abierta', restante: 750, inicial: 750, recibido: '2026-01-01', costoUnitario: 1, ...p,
})

describe('costoReceta', () => {
  it('reproduce el costo del recetario del cliente dentro del 10%', () => {
    const fuera = RECETAS.filter((r) => {
      const desvio = Math.abs(costoReceta(r, insumos) - r.costoDoc) / r.costoDoc
      return desvio > 0.1
    }).map((r) => r.nombre)
    // Las dos que quedan fuera son hallazgos para el gerente, no bugs de este cálculo:
    //   Centella  — el recetario cobra ~$7.7 de garnitura que no dosifica.
    //   Sbagliato — el recetario declara $43.35 y sus propias dosis dan ~$48.91.
    // Si el gerente corrige alguna de las dos, esta lista se achica.
    expect(fuera).toEqual(['Centella', 'Sbagliato'])
  })
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
      insumoId: 'INS-01', cerrado: 2000, abierto: 420, total: 2420,
    })
  })

  it('no esconde el negativo de un lote que se agotó vendiendo sin existencia', () => {
    const lotes = [lote({ id: 'L1', insumoId: 'INS-01', estado: 'agotada', restante: -120 })]
    expect(existencia(lotes, 'INS-01').total).toBe(-120)
  })
})

describe('explotarVenta', () => {
  it('suma los ingredientes de varias recetas que comparten insumo', () => {
    const venta: Venta = {
      id: 'v1', folio: 'A-1', fecha: '2026-01-01', cuenta: 'Barra 1', total: 0, aplicada: false,
      lineas: [
        { tipo: 'receta', refId: 'REC-08', cantidad: 2 }, // Gin & Tonic: 60 ml Tanqueray c/u
        { tipo: 'receta', refId: 'REC-09', cantidad: 1 }, // Martini Seco: 60 ml Tanqueray
        { tipo: 'insumo', refId: 'INS-01', cantidad: 45 }, // mezcal en copeo directo
      ].map((l) => ({ ...l, precio: 0 })) as Venta['lineas'],
    }
    const consumo = explotarVenta(venta, recetas)
    expect(consumo['INS-03']).toBe(180)
    expect(consumo['INS-31']).toBe(3) // una aceituna por trago
    expect(consumo['INS-01']).toBe(45)
  })
})

describe('consumirPeps', () => {
  const lotes = [
    lote({ id: 'L-viejo', insumoId: 'INS-01', restante: 100, recibido: '2026-01-01' }),
    lote({ id: 'L-nuevo', insumoId: 'INS-01', restante: 500, recibido: '2026-02-01' }),
    lote({ id: 'L-cerrado', insumoId: 'INS-01', estado: 'cerrada', restante: 1000, recibido: '2025-01-01' }),
  ]

  it('agota el lote más viejo antes de tocar el siguiente', () => {
    expect(consumirPeps(lotes, 'INS-01', 250)).toEqual({
      asignaciones: [{ loteId: 'L-viejo', cantidad: 100 }, { loteId: 'L-nuevo', cantidad: 150 }],
      faltante: 0,
    })
  })

  it('nunca consume de una botella cerrada', () => {
    const { asignaciones } = consumirPeps(lotes, 'INS-01', 600)
    expect(asignaciones.map((a) => a.loteId)).not.toContain('L-cerrado')
  })

  it('reporta faltante sin bloquear, cargándolo al lote más viejo', () => {
    const r = consumirPeps(lotes, 'INS-01', 800)
    expect(r.faltante).toBe(200)
    expect(r.asignaciones.reduce((s, a) => s + a.cantidad, 0)).toBe(800)
  })

  it('sin lotes abiertos no asigna nada pero reporta el faltante completo', () => {
    expect(consumirPeps(lotes, 'INS-09', 60)).toEqual({ asignaciones: [], faltante: 60 })
  })
})

describe('cantidadMerma', () => {
  it('convierte porcentaje a cantidad', () => {
    expect(cantidadMerma(1000, 2.5)).toBe(25)
  })
})
