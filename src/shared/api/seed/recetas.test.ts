import { describe, expect, it } from 'vitest'
import { byId } from '@/shared/lib'
import { CABALLITO_ML } from '@/shared/model/unidades'
import { costoReceta } from '@/entities/receta'
import { INSUMOS } from './insumos'
import { COCTELES, RECETAS, RECETAS_COPEO } from './recetas'

const insumos = byId(INSUMOS)

describe('servicios de copeo', () => {
  it('hay un servicio por cada destilado', () => {
    const destilados = INSUMOS.filter((i) => i.categoria === 'Destilados')
    expect(RECETAS_COPEO).toHaveLength(destilados.length)
    expect(RECETAS_COPEO.every((r) => r.ingredientes.length === 1)).toBe(true)
  })

  it('cada servicio descuenta la medida del caballito de su destilado', () => {
    const mezcal = RECETAS_COPEO.find((r) => r.nombre.startsWith('Mezcal'))!
    expect(mezcal.ingredientes[0]).toEqual({ insumoId: 'INS-01', cantidad: CABALLITO_ML })
  })

  it('un caballito de mezcal cuesta lo que valen sus 45 ml', () => {
    const mezcal = RECETAS_COPEO.find((r) => r.nombre.startsWith('Mezcal'))!
    // 45 ml a $0.15/ml
    expect(costoReceta(mezcal, insumos)).toBeCloseTo(6.75, 2)
  })

  it('todavía no tienen precio de venta: lo fija el cliente', () => {
    expect(RECETAS_COPEO.every((r) => r.precio === 0)).toBe(true)
  })

  it('el catálogo de recetas junta cócteles y copeo', () => {
    expect(RECETAS).toHaveLength(COCTELES.length + RECETAS_COPEO.length)
  })

  it('los ids no chocan con los de los cócteles', () => {
    expect(new Set(RECETAS.map((r) => r.id)).size).toBe(RECETAS.length)
  })
})
