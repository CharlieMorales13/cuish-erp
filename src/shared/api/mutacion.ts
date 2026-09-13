import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Mutación que invalida todo el caché al terminar.
 *
 * ponytail: invalidación total. Con 34 insumos y ~100 lotes es gratis, y evita la clase
 * de bug donde una pantalla se queda mostrando existencia vieja. Si el catálogo crece a
 * miles de filas, invalidar por llave.
 */
export function useMutacionInvalidante<A, R>(fn: (arg: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries() })
}
