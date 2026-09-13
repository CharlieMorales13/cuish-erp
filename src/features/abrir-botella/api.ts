import { delay } from '@/shared/api/db'
import { useMutacionInvalidante } from '@/shared/api/mutacion'
import { buscarLote } from '@/entities/lote'
import { registrarMovimiento } from '@/entities/movimiento'

/** Botella cerrada → botella de copeo. RF-ERP-09. */
export async function abrirBotella(loteId: string) {
  const lote = buscarLote(loteId)
  if (!lote) throw new Error(`Lote desconocido: ${loteId}`)
  lote.estado = 'abierta'
  registrarMovimiento({
    tipo: 'apertura',
    insumoId: lote.insumoId,
    loteId: lote.id,
    cantidad: 0,
    motivo: `Apertura de botella${lote.marbete ? ` · marbete ${lote.marbete}` : ''}`,
  })
  return delay(lote)
}

export const useAbrirBotella = () => useMutacionInvalidante(abrirBotella)
