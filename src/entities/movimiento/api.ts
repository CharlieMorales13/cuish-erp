import { useQuery } from '@tanstack/react-query'
import { USUARIO, ahora, db, delay, nuevoId } from '@/shared/api/db'
import type { Movimiento } from '@/shared/api/contracts'

export const movimientoKeys = { todos: ['movimientos'] as const }

export const getMovimientos = () => delay(db.movimientos)

export const useMovimientos = () =>
  useQuery({ queryKey: movimientoKeys.todos, queryFn: getMovimientos })

/** Asienta una línea del kardex. Único punto de escritura de `movimiento_inventario`. */
export function registrarMovimiento(
  m: Omit<Movimiento, 'id' | 'fecha' | 'usuario'> & Partial<Pick<Movimiento, 'fecha' | 'usuario'>>,
): Movimiento {
  const movimiento: Movimiento = {
    id: nuevoId('MOV'),
    fecha: ahora(),
    usuario: USUARIO,
    ...m,
  }
  db.movimientos.unshift(movimiento)
  return movimiento
}
