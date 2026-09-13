import { useQuery } from '@tanstack/react-query'
import { db, delay } from '@/shared/api/db'
import type { Conteo } from '@/shared/api/contracts'

export const conteoKeys = { todos: ['conteos'] as const }

export const getConteos = () => delay(db.conteos)

export const useConteos = () => useQuery({ queryKey: conteoKeys.todos, queryFn: getConteos })

export function insertarConteo(conteo: Conteo): Conteo {
  db.conteos.unshift(conteo)
  return conteo
}

export const buscarConteo = (id: string) => db.conteos.find((c) => c.id === id)
