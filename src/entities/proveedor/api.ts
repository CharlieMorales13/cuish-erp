import { useQuery } from '@tanstack/react-query'
import { db, delay, nuevoId } from '@/shared/api/db'
import type { Proveedor } from '@/shared/api/contracts'

export const proveedorKeys = { todos: ['proveedores'] as const }

export const getProveedores = () => delay(db.proveedores)

export async function guardarProveedor(proveedor: Proveedor): Promise<Proveedor> {
  const i = db.proveedores.findIndex((x) => x.id === proveedor.id)
  if (i >= 0) db.proveedores[i] = proveedor
  else db.proveedores.push({ ...proveedor, id: nuevoId('PRV') })
  return delay(proveedor)
}

export const useProveedores = () =>
  useQuery({ queryKey: proveedorKeys.todos, queryFn: getProveedores })

export const buscarProveedor = (id: string) => db.proveedores.find((p) => p.id === id)
