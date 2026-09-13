import { describe, expect, it } from 'vitest'
import { byId } from '@/shared/lib'
import { TRAGO_ML } from '@/shared/model/unidades'
import { costoReceta } from '@/entities/receta'
import { INSUMOS } from './insumos'
import { COCTELES, RECETAS, TRAGOS } from './recetas'

const insumos = byId(INSUMOS)

describe('carta alineada al POS', () => {
  it('trae los 34 productos vendibles del catálogo compartido', () => {
    expect(RECETAS).toHaveLength(34)
  })

  it('respeta las categorías de menú y su conteo', () => {
    const porCategoria = RECETAS.reduce<Record<string, number>>((acc, r) => {
      acc[r.categoriaMenu!] = (acc[r.categoriaMenu!] ?? 0) + 1
      return acc
    }, {})
    // El POS reporta 44 productos: estos vendibles más 10 padres no vendibles.
    expect(porCategoria).toEqual({
      Mezcal: 6,
      Cervezas: 4,
      Degustaciones: 2,
      Coctelería: 16,
      'Agua de sol': 4,
      Bebidas: 2,
    })
  })

  it('agrupa las variantes bajo su producto padre, como producto_padre_id', () => {
    const margaritas = RECETAS.filter((r) => r.padre === 'Margarita de Mezcal')
    expect(margaritas).toHaveLength(4)
    expect(margaritas.map((r) => r.precio).sort((a, b) => a - b)).toEqual([90, 100, 110, 130])
  })

  it('no hay ids repetidos', () => {
    expect(new Set(RECETAS.map((r) => r.id)).size).toBe(RECETAS.length)
  })

  it('toda receta descuenta al menos un insumo del catálogo', () => {
    for (const receta of RECETAS) {
      expect(receta.ingredientes.length).toBeGreaterThan(0)
      for (const i of receta.ingredientes) {
        expect(insumos[i.insumoId], `${receta.nombre} → ${i.insumoId}`).toBeDefined()
        expect(i.cantidad).toBeGreaterThan(0)
      }
    }
  })

  it('todas traen precio de venta: vienen del POS, no los inventamos', () => {
    expect(RECETAS.every((r) => r.precio > 0)).toBe(true)
  })

  it('ninguna se vende por debajo de su costo', () => {
    const perdedoras = RECETAS.filter((r) => costoReceta(r, insumos) >= r.precio).map(
      (r) => r.nombre,
    )
    expect(perdedoras).toEqual([])
  })
})

describe('tragos derechos', () => {
  it('hay uno por cada mezcal que el POS vende por copa', () => {
    expect(TRAGOS.map((r) => r.nombre)).toEqual([
      'Espadín Joven - Trago 2 oz',
      'Tobalá - Trago 2 oz',
      'Pechuga Artesanal - Trago 2 oz',
    ])
  })

  it('sirven 2 oz del mezcal que les da nombre, sin nada más', () => {
    for (const trago of TRAGOS) {
      expect(trago.ingredientes).toHaveLength(1)
      expect(trago.ingredientes[0].cantidad).toBeCloseTo(TRAGO_ML, 4)
    }
  })

  it('un trago de Espadín cuesta lo que valen sus 59 ml', () => {
    const espadin = TRAGOS.find((r) => r.padre === 'Espadín Joven')!
    // 750 ml a $250 la botella
    expect(costoReceta(espadin, insumos)).toBeCloseTo(TRAGO_ML * (250 / 750), 4)
  })

  it('vender la botella completa cuesta la botella completa', () => {
    const botella = RECETAS.find((r) => r.nombre === 'Espadín Joven - Botella 750 ml')!
    expect(costoReceta(botella, insumos)).toBeCloseTo(250, 4)
  })
})

describe('cocteles', () => {
  it('son los de la categoría Coctelería', () => {
    expect(COCTELES).toHaveLength(16)
    expect(COCTELES.every((r) => r.categoriaMenu === 'Coctelería')).toBe(true)
  })

  it('todos llevan hielo salvo que la carta diga otra cosa', () => {
    expect(COCTELES.every((r) => r.ingredientes.some((i) => i.insumoId === 'INS-22'))).toBe(true)
  })

  it('la variante que nombra un mezcal más caro cuesta más de producir', () => {
    const espadin = RECETAS.find((r) => r.nombre === 'Paloma de Agave - Mezcal espadín')!
    const pechuga = RECETAS.find((r) => r.nombre === 'Paloma de Agave - Mezcal de pecho')!
    expect(costoReceta(pechuga, insumos)).toBeGreaterThan(costoReceta(espadin, insumos))
    expect(pechuga.precio).toBeGreaterThan(espadin.precio)
  })
})
