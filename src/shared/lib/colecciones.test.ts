import { describe, expect, it } from 'vitest'
import { byId } from './colecciones'

describe('byId', () => {
  it('indexa por id', () => {
    expect(
      byId([
        { id: 'a', n: 1 },
        { id: 'b', n: 2 },
      ]),
    ).toEqual({
      a: { id: 'a', n: 1 },
      b: { id: 'b', n: 2 },
    })
  })

  it('una lista vacía da un índice vacío', () => {
    expect(byId([])).toEqual({})
  })

  it('con ids repetidos gana el último', () => {
    expect(
      byId([
        { id: 'a', n: 1 },
        { id: 'a', n: 2 },
      ]).a.n,
    ).toBe(2)
  })
})
