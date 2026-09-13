import type { Insumo, Receta } from '@/shared/api/contracts'

/** Costo de producción calculado desde el BOM. RF-ERP-08. */
export function costoReceta(receta: Receta, insumos: Record<string, Insumo>): number {
  return receta.ingredientes.reduce((total, ing) => {
    const insumo = insumos[ing.insumoId]
    return insumo ? total + ing.cantidad * insumo.costoUnitario : total
  }, 0)
}

export const margen = (precio: number, costo: number) =>
  precio > 0 ? (precio - costo) / precio : 0

/**
 * Qué tanto se aparta el costo calculado del que declara el recetario del cliente.
 * Un desvío alto es un hallazgo para el gerente, no un bug: significa que las dosis
 * documentadas no dan el costo documentado.
 */
export const desvioCosto = (calculado: number, declarado: number) =>
  declarado > 0 ? Math.abs(calculado - declarado) / declarado : 0

export const DESVIO_TOLERADO = 0.05

export const METODOS = [
  'Construido',
  'Refrescado',
  'Shakeado',
  'Macerado',
  'Roll',
  'Construido / Shakeado',
]
