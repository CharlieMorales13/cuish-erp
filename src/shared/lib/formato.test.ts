import { describe, expect, it } from 'vitest'
import { cantidad, fecha, hoyISO, money, moneyFino, pct } from './formato'

// Intl separa con espacios duros (U+00A0 / U+202F). Se normalizan a espacio normal para no
// comparar contra bytes invisibles.
const limpio = (s: string) => s.replace(new RegExp('[\\u00a0\\u202f]', 'g'), ' ')

describe('money', () => {
  it('formatea pesos mexicanos', () => {
    expect(limpio(money(1234.5))).toBe('$1,234.50')
  })

  it('formatea negativos', () => {
    expect(limpio(money(-100))).toContain('100.00')
  })
})

describe('moneyFino', () => {
  it('usa 3 decimales por debajo del centavo, que es donde vive el hielo a $0.005/g', () => {
    expect(moneyFino(0.0048)).toBe('$0.005')
  })

  it('por encima del centavo formatea como moneda normal', () => {
    expect(limpio(moneyFino(1.41))).toBe('$1.41')
  })

  it('el cero no cae en el caso fino', () => {
    expect(limpio(moneyFino(0))).toBe('$0.00')
  })
})

describe('cantidad', () => {
  it('agrega la unidad cuando se le pasa', () => {
    expect(limpio(cantidad(1500, 'ml'))).toBe('1,500 ml')
  })

  it('sin unidad solo formatea el número', () => {
    expect(limpio(cantidad(1500))).toBe('1,500')
  })

  it('recorta a 2 decimales', () => {
    expect(cantidad(22.567)).toBe('22.57')
  })
})

describe('pct', () => {
  it('convierte fracción a porcentaje', () => {
    expect(pct(0.755)).toBe('75.5%')
  })
})

describe('fecha', () => {
  it('formatea una fecha ISO en es-MX', () => {
    expect(fecha('2026-03-15')).toMatch(/2026/)
  })
})

describe('hoyISO', () => {
  it('da yyyy-mm-dd', () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
