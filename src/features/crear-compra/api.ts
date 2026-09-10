import { delay, hoy } from '@/shared/api/db'
import { useMutacionInvalidante } from '@/shared/api/mutacion'
import type { LineaCompra } from '@/shared/api/contracts'
import { insertarCompra } from '@/entities/compra'

export interface NuevaRequisicion {
  proveedorId: string
  lineas: LineaCompra[]
  cascosPrestados: number
}

export async function crearCompra(datos: NuevaRequisicion) {
  return delay(insertarCompra({ ...datos, fecha: hoy() }))
}

export const useCrearCompra = () => useMutacionInvalidante(crearCompra)
