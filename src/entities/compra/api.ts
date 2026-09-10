import { useQuery } from '@tanstack/react-query'
import { db, delay, nuevoId } from '@/shared/api/db'
import type { Compra } from '@/shared/api/contracts'

export const compraKeys = { todas: ['compras'] as const }

export const getCompras = () => delay(db.compras)

export const useCompras = () => useQuery({ queryKey: compraKeys.todas, queryFn: getCompras })

export function insertarCompra(
  datos: Omit<Compra, 'id' | 'folio' | 'estado' | 'cascosDevueltos'>,
): Compra {
  const folio = nuevoId('CMP')
  const compra: Compra = { ...datos, id: folio, folio, estado: 'requisicion', cascosDevueltos: 0 }
  db.compras.unshift(compra)
  return compra
}

export const buscarCompra = (id: string) => db.compras.find((c) => c.id === id)
