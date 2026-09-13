import { describe, expect, it } from 'vitest'
import { esErrorDeDatos, mensajeDeError } from './errores'

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

describe('esErrorDeDatos', () => {
  it('reconoce los errores de referencia que lanza la capa de datos', () => {
    expect(esErrorDeDatos(new Error('Venta desconocida: v1'))).toBe(true)
    expect(esErrorDeDatos(new Error('Compra desconocida: c1'))).toBe(true)
  })

  it('un fallo de red no lo es: ese sí tiene caso reintentarlo', () => {
    expect(esErrorDeDatos(new Error('No hay conexión con el servidor.'))).toBe(false)
    expect(esErrorDeDatos('cualquier cosa')).toBe(false)
  })
})
