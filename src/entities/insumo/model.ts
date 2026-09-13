import type { Existencia, Insumo } from '@/shared/api/contracts'

export type EstadoExistencia = 'Agotado' | 'Bajo mínimo' | 'Sobre máximo' | 'En rango'

export function estadoExistencia(total: number, insumo: Insumo): EstadoExistencia {
  if (total <= 0) return 'Agotado'
  if (total < insumo.min) return 'Bajo mínimo'
  if (total > insumo.max) return 'Sobre máximo'
  return 'En rango'
}

export const bajoMinimo = (e: Existencia | undefined, insumo: Insumo) => !!e && e.total < insumo.min

/** El costo unitario nunca se captura: siempre se deriva de la presentación de compra. */
export const costoUnitario = (costoCompra: number, presentacion: number) =>
  presentacion > 0 ? costoCompra / presentacion : 0

/** Valor del inventario a costo de reposición. */
export function valorInventario(insumos: Insumo[], ex: Record<string, Existencia>): number {
  return insumos.reduce((total, i) => total + (ex[i.id]?.total ?? 0) * i.costoUnitario, 0)
}

/**
 * Cuántos servicios rinde una presentación de compra. Para una mezcalería es el número
 * que más importa: cuántos caballitos salen de una botella.
 */
export const rendimiento = (presentacion: number, mlPorServicio: number) =>
  mlPorServicio > 0 ? presentacion / mlPorServicio : 0
