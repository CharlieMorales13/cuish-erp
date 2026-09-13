import { useQuery } from '@tanstack/react-query'
import { db, delay, nuevoId } from '@/shared/api/db'
import { byId } from '@/shared/lib'
import type { Receta } from '@/shared/api/contracts'

export const recetaKeys = { todas: ['recetas'] as const }

export const getRecetas = () => delay(db.recetas)

export async function guardarReceta(receta: Receta): Promise<Receta> {
  const i = db.recetas.findIndex((x) => x.id === receta.id)
  if (i >= 0) db.recetas[i] = receta
  else db.recetas.push({ ...receta, id: nuevoId('REC') })
  return delay(receta)
}

export const useRecetas = () => useQuery({ queryKey: recetaKeys.todas, queryFn: getRecetas })

export function useRecetasById() {
  const { data } = useRecetas()
  return byId(data ?? [])
}

export const recetasActuales = () => db.recetas
