import { useSyncExternalStore } from 'react'
import { mensajeDeError } from './errores'

export interface AvisoDeAccion {
  id: number
  mensaje: string
}

/**
 * Cola de errores de acciones (mutaciones) para enseñarlos una sola vez, en un solo lugar.
 *
 * Una mutación puede dispararse desde un modal que se cierra solo al terminar, así que no
 * siempre hay dónde pintar el error en la pantalla que lo originó. En vez de repetir el
 * manejo en cada botón, React Query reporta aquí todos los fallos y el layout los muestra.
 */
let avisos: AvisoDeAccion[] = []
let siguienteId = 0
const suscriptores = new Set<() => void>()

const notificar = () => suscriptores.forEach((fn) => fn())

export function reportarError(error: unknown) {
  avisos = [...avisos, { id: ++siguienteId, mensaje: mensajeDeError(error) }]
  notificar()
}

export function descartarAviso(id: number) {
  avisos = avisos.filter((a) => a.id !== id)
  notificar()
}

export function limpiarAvisos() {
  avisos = []
  notificar()
}

const suscribir = (fn: () => void) => {
  suscriptores.add(fn)
  return () => suscriptores.delete(fn)
}

export const useAvisosDeAccion = () => useSyncExternalStore(suscribir, () => avisos)
