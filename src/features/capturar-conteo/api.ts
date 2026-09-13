import { ahora, db, delay, nuevoId } from '@/shared/api/db'
import { useMutacionInvalidante } from '@/shared/api/mutacion'
import type { Conteo } from '@/shared/api/contracts'
import { buscarConteo, diferencia, insertarConteo } from '@/entities/conteo'
import { afectarLote, existencia, lotesDe } from '@/entities/lote'
import { registrarMovimiento } from '@/entities/movimiento'

/** Abre un conteo con la existencia teórica congelada al momento. RF-ERP-01. */
export async function crearConteo() {
  const folio = nuevoId('CTO')
  return delay(
    insertarConteo({
      id: folio,
      folio,
      fecha: ahora(),
      estado: 'abierto',
      lineas: db.insumos.map((i) => ({
        insumoId: i.id,
        teorico: existencia(lotesDe(i.id), i.id).total,
        fisico: null,
      })),
    }),
  )
}

export async function guardarConteo({
  conteoId,
  lineas,
}: {
  conteoId: string
  lineas: Conteo['lineas']
}) {
  const conteo = buscarConteo(conteoId)
  if (!conteo) throw new Error(`Conteo desconocido: ${conteoId}`)
  conteo.lineas = lineas
  return delay(conteo)
}

/** Cierra el conteo y asienta un ajuste por cada diferencia contra la existencia física. */
export async function cerrarConteo(conteoId: string) {
  const conteo = buscarConteo(conteoId)
  if (!conteo) throw new Error(`Conteo desconocido: ${conteoId}`)

  for (const linea of conteo.lineas) {
    const dif = diferencia(linea)
    if (dif === null || dif === 0) continue
    const lote = lotesDe(linea.insumoId).find((l) => l.estado === 'abierta')
    if (lote) afectarLote(lote, dif)
    registrarMovimiento({
      tipo: 'conteo',
      insumoId: linea.insumoId,
      loteId: lote?.id,
      cantidad: dif,
      motivo: dif > 0 ? 'Sobrante en conteo físico' : 'Faltante en conteo físico',
      ref: conteo.folio,
    })
  }

  conteo.estado = 'cerrado'
  return delay(conteo)
}

export const useCrearConteo = () => useMutacionInvalidante(crearConteo)
export const useGuardarConteo = () => useMutacionInvalidante(guardarConteo)
export const useCerrarConteo = () => useMutacionInvalidante(cerrarConteo)
