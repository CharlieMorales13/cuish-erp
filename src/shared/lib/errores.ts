/**
 * Convierte cualquier cosa que se haya lanzado en un mensaje que se le pueda enseñar a una
 * persona. `catch` en JavaScript no garantiza un Error: puede llegar un string, un objeto de
 * la red o `undefined`.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return 'Ocurrió un error inesperado.'
}
