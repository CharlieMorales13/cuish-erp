import type { Existencia, Lote } from '@/shared/api/contracts'

export const ETIQUETA_ESTADO: Record<Lote['estado'], string> = {
  cerrada: 'Botella cerrada',
  abierta: 'Abierta / copeo',
  agotada: 'Agotada',
}

/**
 * Existencia partida en botella cerrada vs. botella abierta (copeo). RF-ERP-09.
 * Los insumos que no son botella caen todos en `abierto`.
 */
export function existencia(lotes: Lote[], insumoId: string): Existencia {
  let cerrado = 0
  let abierto = 0
  for (const lote of lotes) {
    if (lote.insumoId !== insumoId) continue
    if (lote.estado === 'cerrada') cerrado += lote.restante
    // Los agotados suman también: normalmente valen 0, pero uno que quedó en negativo
    // por una venta sin existencia (RF-ERP-13) tiene que seguir viéndose en el total.
    // Si se descartaran, el faltante desaparecería del inventario en silencio.
    else abierto += lote.restante
  }
  return { insumoId, cerrado, abierto, total: cerrado + abierto }
}

export function existencias(lotes: Lote[], insumoIds: string[]): Record<string, Existencia> {
  return Object.fromEntries(insumoIds.map((id) => [id, existencia(lotes, id)]))
}

export interface Asignacion {
  loteId: string
  cantidad: number
}

export interface ResultadoConsumo {
  asignaciones: Asignacion[]
  /** Cantidad que no alcanzó a cubrirse con existencia disponible. */
  faltante: number
}

/**
 * Reparte un consumo entre los lotes abiertos, PEPS (el más viejo primero).
 * Si no alcanza, el sobrante se carga al lote abierto más viejo y queda en negativo:
 * RF-ERP-13 pide alertar sin bloquear el cierre de la cuenta.
 */
export function consumirPeps(lotes: Lote[], insumoId: string, cantidad: number): ResultadoConsumo {
  const abiertos = lotes
    .filter((l) => l.insumoId === insumoId && l.estado === 'abierta' && l.restante > 0)
    .sort((a, b) => a.recibido.localeCompare(b.recibido))

  const asignaciones: Asignacion[] = []
  let pendiente = cantidad
  for (const lote of abiertos) {
    if (pendiente <= 0) break
    const toma = Math.min(lote.restante, pendiente)
    asignaciones.push({ loteId: lote.id, cantidad: toma })
    pendiente -= toma
  }

  if (pendiente > 1e-9) {
    // ponytail: el sobrante se carga al lote más viejo aunque quede negativo.
    // Sin lote abierto no hay dónde cargarlo: se reporta solo como faltante.
    if (asignaciones.length > 0) asignaciones[0].cantidad += pendiente
    return { asignaciones, faltante: pendiente }
  }
  return { asignaciones, faltante: 0 }
}

/** Aplica una cantidad con signo sobre un lote y lo marca agotado al llegar a cero. */
export function afectarLote(lote: Lote, cantidad: number) {
  lote.restante = Number((lote.restante + cantidad).toFixed(4))
  if (lote.estado !== 'cerrada' && lote.restante <= 0) lote.estado = 'agotada'
}
