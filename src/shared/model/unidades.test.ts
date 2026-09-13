import { describe, expect, it } from 'vitest'
import { CABALLITO_ML, ML_POR_ONZA, mlAOnzas, onzasAMl } from './unidades'

describe('conversión de onzas', () => {
  it('una onza son 29.5735 ml', () => {
    expect(onzasAMl(1)).toBe(ML_POR_ONZA)
  })

  it('ida y vuelta no pierde precisión', () => {
    expect(mlAOnzas(onzasAMl(1.5))).toBeCloseTo(1.5, 10)
  })

  it('el caballito de 45 ml equivale a 1.5 oz', () => {
    expect(mlAOnzas(CABALLITO_ML)).toBeCloseTo(1.52, 2)
  })
})
