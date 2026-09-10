import { useQuery } from '@tanstack/react-query'
import { db, delay, nuevoId } from '@/shared/api/db'
import { byId } from '@/shared/lib'
import type { Insumo } from '@/shared/api/contracts'
import { costoUnitario } from './model'

export const insumoKeys = { todos: ['insumos'] as const }

export const getInsumos = () => delay(db.insumos)

export async function guardarInsumo(insumo: Insumo): Promise<Insumo> {
  const normalizado: Insumo = {
    ...insumo,
    costoUnitario: costoUnitario(insumo.costoCompra, insumo.presentacion),
  }
  const i = db.insumos.findIndex((x) => x.id === insumo.id)
  if (i >= 0) db.insumos[i] = normalizado
  else db.insumos.push({ ...normalizado, id: nuevoId('INS') })
  return delay(normalizado)
}

export const useInsumos = () => useQuery({ queryKey: insumoKeys.todos, queryFn: getInsumos })

export function useInsumosById() {
  const { data } = useInsumos()
  return byId(data ?? [])
}

export const buscarInsumo = (insumoId: string) => db.insumos.find((i) => i.id === insumoId)
