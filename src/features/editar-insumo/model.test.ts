import { describe, expect, it } from 'vitest'
import { esquemaInsumo } from './model'

const valido = {
  id: 'INS-01',
  nombre: 'Mezcal',
  categoria: 'Destilados',
  unidad: 'ml',
  presentacion: 1000,
  costoCompra: 150,
  piezasPorCaja: '',
  min: 1500,
  max: 6000,
  esBotella: true,
  caduca: false,
}

describe('esquemaInsumo', () => {
  it('acepta un insumo bien formado', () => {
    expect(esquemaInsumo.safeParse(valido).success).toBe(true)
  })

  it('convierte los números que llegan como texto del formulario', () => {
    const r = esquemaInsumo.parse({ ...valido, presentacion: '750', costoCompra: '665' })
    expect(r.presentacion).toBe(750)
    expect(r.costoCompra).toBe(665)
  })

  it('trata el campo vacío de piezas por caja como ausente', () => {
    expect(esquemaInsumo.parse(valido).piezasPorCaja).toBeUndefined()
  })

  it('rechaza presentación cero: dividiría entre cero al costear', () => {
    const r = esquemaInsumo.safeParse({ ...valido, presentacion: 0 })
    expect(r.success).toBe(false)
    expect(JSON.stringify(r.error?.issues)).toMatch(/mayor a cero/)
  })

  it('rechaza un máximo por debajo del mínimo, y lo señala en el campo máximo', () => {
    const r = esquemaInsumo.safeParse({ ...valido, min: 100, max: 50 })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toEqual(['max'])
  })

  it('rechaza nombre demasiado corto', () => {
    expect(esquemaInsumo.safeParse({ ...valido, nombre: 'M' }).success).toBe(false)
  })

  it('rechaza una unidad que no está en el catálogo de unidades', () => {
    expect(esquemaInsumo.safeParse({ ...valido, unidad: 'litros' }).success).toBe(false)
  })
})
