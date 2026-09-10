import { delay } from '@/shared/api/db'
import { useMutacionInvalidante } from '@/shared/api/mutacion'
import { afectarLote, buscarLote } from '@/entities/lote'
import { registrarMovimiento } from '@/entities/movimiento'

export type TipoManual = 'salida' | 'ajuste' | 'merma'

export const ETIQUETA_MANUAL: Record<TipoManual, string> = {
  salida: 'Salida manual',
  ajuste: 'Ajuste manual',
  merma: 'Merma',
}

export interface MovimientoManual {
  tipo: TipoManual
  loteId: string
  cantidad: number
  motivo: string
}

/** Salida, ajuste o merma sobre un lote concreto. RF-ERP-02, RF-ERP-03. */
export async function registrarMovimientoManual(input: MovimientoManual) {
  const lote = buscarLote(input.loteId)
  if (!lote) throw new Error(`Lote desconocido: ${input.loteId}`)

  // El ajuste suma existencia; salida y merma la restan.
  const signo = input.tipo === 'ajuste' ? 1 : -1
  afectarLote(lote, signo * input.cantidad)
  registrarMovimiento({
    tipo: input.tipo,
    insumoId: lote.insumoId,
    loteId: lote.id,
    cantidad: signo * input.cantidad,
    motivo: input.motivo || ETIQUETA_MANUAL[input.tipo],
  })
  return delay(lote)
}

export const useRegistrarMovimientoManual = () => useMutacionInvalidante(registrarMovimientoManual)
