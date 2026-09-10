import { describe, expect, it } from 'vitest'
import { diasParaCaducar } from './fechas'

const HOY = new Date('2026-03-15T13:45:00')

describe('diasParaCaducar', () => {
  it('es null cuando el producto no maneja caducidad', () => {
    expect(diasParaCaducar(undefined, HOY)).toBeNull()
  })

  it('lo que caduca hoy da cero, no un número negativo por la hora', () => {
    expect(diasParaCaducar('2026-03-15', HOY)).toBe(0)
  })

  it('cuenta los días que faltan', () => {
    expect(diasParaCaducar('2026-03-25', HOY)).toBe(10)
  })

  it('lo ya caducado da negativo', () => {
    expect(diasParaCaducar('2026-03-10', HOY)).toBe(-5)
  })

  it('no muta la fecha que recibe', () => {
    const hoy = new Date('2026-03-15T13:45:00')
    diasParaCaducar('2026-03-25', hoy)
    expect(hoy.getHours()).toBe(13)
  })

  it('cruza el cambio de mes', () => {
    expect(diasParaCaducar('2026-04-01', HOY)).toBe(17)
  })
})
