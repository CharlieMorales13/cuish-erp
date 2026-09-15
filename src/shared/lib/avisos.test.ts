import { beforeEach, describe, expect, it, vi } from 'vitest'
import { descartarAviso, limpiarAvisos, reportarError, useAvisosDeAccion } from './avisos'
import { renderHook, act } from '@testing-library/react'

beforeEach(limpiarAvisos)

describe('avisos de acción', () => {
  it('acumula los errores reportados', () => {
    const { result } = renderHook(() => useAvisosDeAccion())

    act(() => reportarError(new Error('Falló al aplicar la venta')))
    act(() => reportarError(new Error('Falló al recibir la compra')))

    expect(result.current.map((a) => a.mensaje)).toEqual([
      'Falló al aplicar la venta',
      'Falló al recibir la compra',
    ])
  })

  it('cada aviso tiene id propio, aunque el mensaje se repita', () => {
    const { result } = renderHook(() => useAvisosDeAccion())

    act(() => reportarError(new Error('mismo')))
    act(() => reportarError(new Error('mismo')))

    expect(new Set(result.current.map((a) => a.id)).size).toBe(2)
  })

  it('descartar quita solo ese aviso', () => {
    const { result } = renderHook(() => useAvisosDeAccion())

    act(() => reportarError(new Error('uno')))
    act(() => reportarError(new Error('dos')))
    act(() => descartarAviso(result.current[0].id))

    expect(result.current.map((a) => a.mensaje)).toEqual(['dos'])
  })

  it('notifica a todos los suscriptores', () => {
    const a = renderHook(() => useAvisosDeAccion())
    const b = renderHook(() => useAvisosDeAccion())

    act(() => reportarError(new Error('x')))

    expect(a.result.current).toHaveLength(1)
    expect(b.result.current).toHaveLength(1)
  })

  it('deja de notificar a quien se desmontó', () => {
    const { unmount } = renderHook(() => useAvisosDeAccion())
    const espia = vi.fn()
    unmount()
    act(() => reportarError(new Error('x')))
    expect(espia).not.toHaveBeenCalled()
  })
})
