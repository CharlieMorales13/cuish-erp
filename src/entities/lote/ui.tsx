import { Badge, type Tono } from '@/shared/ui'
import type { Lote } from '@/shared/api/contracts'
import { ETIQUETA_ESTADO } from './model'

const TONO: Record<Lote['estado'], Tono> = { cerrada: 'info', abierta: 'ok', agotada: 'neutral' }

export function EstadoLoteBadge({ estado }: { estado: Lote['estado'] }) {
  return <Badge tono={TONO[estado]}>{ETIQUETA_ESTADO[estado]}</Badge>
}
