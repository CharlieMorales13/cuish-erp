import { describe, expect, it } from 'vitest'
import { mensajeDeError } from './errores'

describe('mensajeDeError', () => {
  it('usa el mensaje del Error', () => {
    expect(mensajeDeError(new Error('Venta desconocida: v1'))).toBe('Venta desconocida: v1')
  })

  it('acepta un string lanzado tal cual', () => {
    expect(mensajeDeError('Se cayó la red')).toBe('Se cayó la red')
  })

  it.each([undefined, null, '', '   ', new Error(''), { status: 500 }, 42])(
    'cae al mensaje genérico con %p, en vez de enseñar "undefined"',
    (valor) => {
      expect(mensajeDeError(valor)).toBe('Ocurrió un error inesperado.')
    },
  )
})
