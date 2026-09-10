import { delay } from '@/shared/api/db'
import { useMutacionInvalidante } from '@/shared/api/mutacion'
import { buscarCompra } from '@/entities/compra'
import { buscarProveedor } from '@/entities/proveedor'

/**
 * Devolución de envase al proveedor. No estaba en los requisitos originales: salió del
 * ticket de Modelo (10 cascos). Falta definir con el cliente si el préstamo se controla
 * por compra o por proveedor, y si tiene costo asociado.
 */
export async function devolverCascos({
  compraId,
  cantidad,
}: {
  compraId: string
  cantidad: number
}) {
  const compra = buscarCompra(compraId)
  if (!compra) throw new Error(`Compra desconocida: ${compraId}`)

  const devueltos = Math.min(compra.cascosPrestados, compra.cascosDevueltos + cantidad)
  const realmenteDevueltos = devueltos - compra.cascosDevueltos
  compra.cascosDevueltos = devueltos

  const proveedor = buscarProveedor(compra.proveedorId)
  if (proveedor)
    proveedor.cascosPrestados = Math.max(0, proveedor.cascosPrestados - realmenteDevueltos)

  return delay(compra)
}

export const useDevolverCascos = () => useMutacionInvalidante(devolverCascos)
