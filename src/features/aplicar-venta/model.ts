import type { Receta, Venta } from '@/shared/api/contracts'

/**
 * Explota una venta del POS a consumo por insumo, resolviendo las recetas. RF-ERP-08.
 * Una venta descuenta de varias partidas a la vez, y dos cócteles distintos que comparten
 * insumo se suman en la misma línea de consumo.
 */
export function explotarVenta(
  venta: Venta,
  recetas: Record<string, Receta>,
): Record<string, number> {
  const consumo: Record<string, number> = {}
  const sumar = (insumoId: string, cantidad: number) => {
    consumo[insumoId] = (consumo[insumoId] ?? 0) + cantidad
  }

  for (const linea of venta.lineas) {
    if (linea.tipo === 'insumo') {
      sumar(linea.refId, linea.cantidad)
      continue
    }
    const receta = recetas[linea.refId]
    if (!receta) continue
    for (const ing of receta.ingredientes) sumar(ing.insumoId, ing.cantidad * linea.cantidad)
  }

  return consumo
}
