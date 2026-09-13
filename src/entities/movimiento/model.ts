import type { TipoMovimiento } from '@/shared/api/contracts'

export const TONO_MOVIMIENTO: Record<
  TipoMovimiento,
  'ok' | 'warn' | 'danger' | 'info' | 'neutral'
> = {
  entrada: 'ok',
  salida: 'warn',
  ajuste: 'info',
  merma: 'danger',
  apertura: 'neutral',
  venta: 'neutral',
  conteo: 'info',
}

/** Merma expresada como porcentaje de la existencia actual. RF-ERP-03. */
export const cantidadMerma = (existenciaTotal: number, porcentaje: number) =>
  (existenciaTotal * porcentaje) / 100

/** Consumo y merma acumulados por insumo, a partir del kardex. */
export function acumularPorInsumo(
  movimientos: Array<{ tipo: TipoMovimiento; insumoId: string; cantidad: number }>,
  tipo: TipoMovimiento,
): Record<string, number> {
  const acumulado: Record<string, number> = {}
  for (const m of movimientos) {
    if (m.tipo !== tipo) continue
    acumulado[m.insumoId] = (acumulado[m.insumoId] ?? 0) - m.cantidad
  }
  return acumulado
}
