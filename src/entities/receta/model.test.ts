import { describe, expect, it } from 'vitest'
import { byId } from '@/shared/lib'
import { INSUMOS } from '@/shared/api/seed/insumos'
import { RECETAS } from '@/shared/api/seed/recetas'
import { DESVIO_TOLERADO, costoReceta, desvioCosto, margen } from './model'

const insumos = byId(INSUMOS)

describe('costoReceta', () => {
  it('toda receta de la carta cuesta algo', () => {
    const sinCosto = RECETAS.filter((r) => costoReceta(r, insumos) <= 0).map((r) => r.nombre)
    expect(sinCosto).toEqual([])
  })

  it('el catálogo del POS no declara costo, así que no hay nada que contrastar todavía', () => {
    // `costoDoc` viene en cero porque la base compartida no guarda costo de producción.
    // Cuando el cliente entregue su costeo, el contraste vuelve a tener sentido y el badge
    // de desviación de la pantalla de Recetas se enciende solo.
    expect(RECETAS.every((r) => r.costoDoc === 0)).toBe(true)
    expect(RECETAS.every((r) => desvioCosto(costoReceta(r, insumos), r.costoDoc) === 0)).toBe(true)
  })

  it('suma cantidad por costo unitario de cada ingrediente', () => {
    const receta = {
      id: 'X',
      nombre: 'X',
      cristaleria: '',
      metodo: '',
      garnitura: '',
      precio: 0,
      costoDoc: 0,
      ingredientes: [
        { insumoId: 'INS-01', cantidad: 100 }, // Espadín Joven, $250 / 750 ml
        { insumoId: 'INS-22', cantidad: 200 }, // Hielo, $24 / 5000 g
      ],
    }
    expect(costoReceta(receta, insumos)).toBeCloseTo(100 * (250 / 750) + 200 * (24 / 5000), 6)
  })

  it('ignora ingredientes cuyo insumo ya no existe en el catálogo', () => {
    const receta = {
      id: 'X',
      nombre: 'X',
      cristaleria: '',
      metodo: '',
      garnitura: '',
      precio: 0,
      costoDoc: 0,
      ingredientes: [
        { insumoId: 'INS-01', cantidad: 100 },
        { insumoId: 'BORRADO', cantidad: 999 },
      ],
    }
    expect(costoReceta(receta, insumos)).toBeCloseTo(100 * (250 / 750), 6)
  })
})

describe('margen', () => {
  it('da la fracción del precio que no se va en costo', () => {
    expect(margen(100, 25)).toBe(0.75)
  })

  it('da cero cuando no hay precio, en vez de dividir entre cero', () => {
    expect(margen(0, 25)).toBe(0)
  })

  it('es negativo cuando el cóctel se vende por debajo de su costo', () => {
    expect(margen(100, 150)).toBe(-0.5)
  })
})

describe('desvioCosto', () => {
  it('es cero cuando el calculado coincide con el declarado', () => {
    expect(desvioCosto(50, 50)).toBe(0)
  })

  it('no le importa el signo del desvío', () => {
    expect(desvioCosto(60, 50)).toBeCloseTo(0.2, 6)
    expect(desvioCosto(40, 50)).toBeCloseTo(0.2, 6)
  })

  it('da cero si el recetario no declara costo, en vez de dividir entre cero', () => {
    expect(desvioCosto(60, 0)).toBe(0)
  })

  it('tolera hasta 5% antes de marcar la receta', () => {
    expect(DESVIO_TOLERADO).toBe(0.05)
  })
})
