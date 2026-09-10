import { useQuery } from '@tanstack/react-query'
import { db, delay, nuevoId } from '@/shared/api/db'
import type { Lote } from '@/shared/api/contracts'
import { existencias } from './model'

export const loteKeys = {
  todos: ['lotes'] as const,
  existencias: ['existencias'] as const,
}

export const getLotes = () => delay(db.lotes)

export const getExistencias = () =>
  delay(
    existencias(
      db.lotes,
      db.insumos.map((i) => i.id),
    ),
  )

export const useLotes = () => useQuery({ queryKey: loteKeys.todos, queryFn: getLotes })
export const useExistencias = () =>
  useQuery({ queryKey: loteKeys.existencias, queryFn: getExistencias })

// --- acceso síncrono para las features que componen varias entidades -----------------
// Es el equivalente al repositorio que en el backend real vivirá dentro de una
// transacción. Las features nunca tocan `db` directamente, pasan por aquí.

export const lotesDe = (insumoId: string) => db.lotes.filter((l) => l.insumoId === insumoId)

export const buscarLote = (loteId: string) => db.lotes.find((l) => l.id === loteId)

export function insertarLote(lote: Omit<Lote, 'id'>): Lote {
  const nuevo = { id: nuevoId('LOT'), ...lote }
  db.lotes.push(nuevo)
  return nuevo
}
