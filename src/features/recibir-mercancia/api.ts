import { delay } from '@/shared/api/db'
import { useMutacionInvalidante } from '@/shared/api/mutacion'
import { buscarInsumo } from '@/entities/insumo'
import { buscarCompra } from '@/entities/compra'
import { buscarProveedor } from '@/entities/proveedor'
import { ingresar } from './model'

export interface EntradaManual {
  insumoId: string
  presentaciones: number
  costoCompra: number
  proveedorId?: string
  marbete?: string
  caducidad?: string
}

export async function registrarEntrada(input: EntradaManual) {
  const insumo = buscarInsumo(input.insumoId)
  if (!insumo) throw new Error(`Insumo desconocido: ${input.insumoId}`)
  return delay(ingresar(insumo, input.presentaciones, input.costoCompra, input))
}

/** Recibe una requisición: crea los lotes de cada partida y registra los cascos prestados. */
export async function recibirCompra(compraId: string) {
  const compra = buscarCompra(compraId)
  if (!compra) throw new Error(`Compra desconocida: ${compraId}`)
  if (compra.estado === 'recibida') return delay(compra)

  for (const linea of compra.lineas) {
    const insumo = buscarInsumo(linea.insumoId)
    if (!insumo) continue
    ingresar(insumo, linea.presentaciones, linea.costoCompra, {
      proveedorId: compra.proveedorId,
      ref: compra.folio,
    })
  }

  compra.estado = 'recibida'
  const proveedor = buscarProveedor(compra.proveedorId)
  if (proveedor) proveedor.cascosPrestados += compra.cascosPrestados
  return delay(compra)
}

export const useRegistrarEntrada = () => useMutacionInvalidante(registrarEntrada)
export const useRecibirCompra = () => useMutacionInvalidante(recibirCompra)
