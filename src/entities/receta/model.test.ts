import { describe, expect, it } from 'vitest'
import { byId } from '@/shared/lib'
import { INSUMOS } from '@/shared/api/seed/insumos'
import { RECETAS } from '@/shared/api/seed/recetas'
import { DESVIO_TOLERADO, costoReceta, desvioCosto, margen } from './model'

const insumos = byId(INSUMOS)

describe('costoReceta', () => {
  it('reproduce el costo del recetario del cliente dentro del 10%', () => {
    const fuera = RECETAS.filter((r) => desvioCosto(costoReceta(r, insumos), r.costoDoc) > 0.1).map(
      (r) => r.nombre,
    )

    // Las dos que quedan fuera son hallazgos para el gerente, no bugs de este cálculo:
    //   Centella  — el recetario cobra ~$7.70 de garnitura que no dosifica.
    //   Sbagliato — el recetario declara $43.35 y sus propias dosis dan ~$48.91.
    // Si el gerente corrige alguna de las dos, esta lista se achica.
    expect(fuera).toEqual(['Centella', 'Sbagliato'])
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
        { insumoId: 'INS-01', cantidad: 100 }, // mezcal, $0.15/ml
        { insumoId: 'INS-17', cantidad: 200 }, // hielo, $0.0048/g
      ],
    }
    expect(costoReceta(receta, insumos)).toBeCloseTo(100 * 0.15 + 200 * (24 / 5000), 6)
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
    expect(costoReceta(receta, insumos)).toBeCloseTo(15, 6)
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
