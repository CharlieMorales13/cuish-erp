import { describe, expect, it } from 'vitest'
import type { Venta } from '@/shared/api/contracts'
import { pendientesDeAplicar, productosEnTicket, totalVentas } from './model'

const venta = (p: Partial<Venta> = {}): Venta => ({
  id: 'v1',
  folio: 'V-1',
  fecha: '2026-01-01T20:00:00',
  cuenta: 'Barra 1',
  lineas: [],
  total: 0,
  aplicada: false,
  ...p,
})

describe('ventas', () => {
  it('totalVentas suma los tickets', () => {
    expect(totalVentas([venta({ total: 370 }), venta({ total: 1290 })])).toBe(1660)
  })

  it('pendientesDeAplicar deja solo las que no descontaron inventario', () => {
    const ventas = [venta({ id: 'a', aplicada: true }), venta({ id: 'b' })]
    expect(pendientesDeAplicar(ventas).map((v) => v.id)).toEqual(['b'])
  })

  it('productosEnTicket cuenta piezas, no líneas', () => {
    const v = venta({
      lineas: [
        { tipo: 'receta', refId: 'REC-01', cantidad: 2, precio: 130 },
        { tipo: 'receta', refId: 'REC-02', cantidad: 3, precio: 145 },
      ],
    })
    expect(productosEnTicket(v)).toBe(5)
  })
})
