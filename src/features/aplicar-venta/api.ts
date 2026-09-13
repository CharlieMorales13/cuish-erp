import { delay } from '@/shared/api/db'
import { useMutacionInvalidante } from '@/shared/api/mutacion'
import { byId } from '@/shared/lib'
import type { Venta } from '@/shared/api/contracts'
import { afectarLote, buscarLote, consumirPeps, lotesDe } from '@/entities/lote'
import { registrarMovimiento } from '@/entities/movimiento'
import { recetasActuales } from '@/entities/receta'
import { buscarVenta, ventasActuales } from '@/entities/venta'
import { explotarVenta } from './model'

export interface Faltante {
  insumoId: string
  cantidad: number
}

export interface ResultadoAplicacion {
  venta: Venta
  /** Insumos que no alcanzaron: se alerta sin bloquear (RF-ERP-13). */
  faltantes: Faltante[]
}

function aplicar(venta: Venta): Faltante[] {
  const consumo = explotarVenta(venta, byId(recetasActuales()))
  const faltantes: Faltante[] = []

  for (const [insumoId, cantidad] of Object.entries(consumo)) {
    const { asignaciones, faltante } = consumirPeps(lotesDe(insumoId), insumoId, cantidad)

    for (const asignacion of asignaciones) {
      const lote = buscarLote(asignacion.loteId)
      if (!lote) continue
      afectarLote(lote, -asignacion.cantidad)
      registrarMovimiento({
        tipo: 'venta',
        insumoId,
        loteId: lote.id,
        cantidad: -asignacion.cantidad,
        motivo: `Venta ${venta.folio} · ${venta.cuenta}`,
        ref: venta.folio,
      })
    }

    if (faltante > 0) {
      faltantes.push({ insumoId, cantidad: faltante })
      if (asignaciones.length === 0) {
        registrarMovimiento({
          tipo: 'venta',
          insumoId,
          cantidad: -faltante,
          motivo: `Venta ${venta.folio} · sin existencia`,
          ref: venta.folio,
        })
      }
    }
  }

  venta.aplicada = true
  return faltantes
}

/**
 * Descuenta el inventario de una venta cerrada en el POS. RF-ERP-11.
 * Idempotente por id de venta: un reenvío no descuenta dos veces (RF-INT-02).
 */
export async function aplicarVenta(ventaId: string): Promise<ResultadoAplicacion> {
  const venta = buscarVenta(ventaId)
  if (!venta) throw new Error(`Venta desconocida: ${ventaId}`)
  if (venta.aplicada) return delay({ venta, faltantes: [] })
  return delay({ venta, faltantes: aplicar(venta) })
}

let sembrado = false

/**
 * La semilla marca qué ventas ya venían aplicadas, pero no trae su kardex. Se re-aplican
 * al arrancar para que existencias y movimientos sean coherentes desde el primer render.
 *
 * Tiene que ser idempotente: `aplicar()` vuelve a marcar la venta como aplicada, así que
 * sin este candado una segunda corrida (un hot-reload del módulo, por ejemplo) descontaría
 * el inventario de nuevo.
 */
export function sembrarVentasAplicadas() {
  if (sembrado) return
  sembrado = true
  for (const venta of ventasActuales()) {
    if (!venta.aplicada) continue
    venta.aplicada = false
    aplicar(venta)
  }
}

/** Solo para pruebas: permite volver a sembrar tras reiniciar la base. */
export function reiniciarSiembra() {
  sembrado = false
}

export const useAplicarVenta = () => useMutacionInvalidante(aplicarVenta)
