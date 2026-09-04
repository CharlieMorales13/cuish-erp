import type { Existencia, Insumo, Lote, Receta, Venta } from './types'

export const byId = <T extends { id: string }>(xs: T[]) =>
  Object.fromEntries(xs.map((x) => [x.id, x])) as Record<string, T>

/** Costo de producción calculado desde el BOM. RF-ERP-08. */
export function costoReceta(receta: Receta, insumos: Record<string, Insumo>): number {
  return receta.ingredientes.reduce((total, ing) => {
    const insumo = insumos[ing.insumoId]
    return insumo ? total + ing.cantidad * insumo.costoUnitario : total
  }, 0)
}

/**
 * Existencia partida en botella cerrada vs botella abierta (copeo). RF-ERP-09.
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

export function existencias(lotes: Lote[], insumos: Insumo[]): Record<string, Existencia> {
  return Object.fromEntries(insumos.map((i) => [i.id, existencia(lotes, i.id)]))
}

/** Explota una venta del POS a consumo por insumo, resolviendo recetas. RF-ERP-08. */
export function explotarVenta(venta: Venta, recetas: Record<string, Receta>): Record<string, number> {
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

export interface Asignacion {
  loteId: string
  cantidad: number
}

export interface ResultadoConsumo {
  asignaciones: Asignacion[]
  /** cantidad que no alcanzó a cubrirse con existencia disponible */
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

/** Merma expresada como porcentaje de la existencia actual. RF-ERP-03. */
export function cantidadMerma(existenciaTotal: number, porcentaje: number): number {
  return (existenciaTotal * porcentaje) / 100
}

export const bajoMinimo = (e: Existencia | undefined, insumo: Insumo) =>
  !!e && e.total < insumo.min

export function diasParaCaducar(caducidad: string | undefined, hoy = new Date()): number | null {
  if (!caducidad) return null
  const dia = 24 * 60 * 60 * 1000
  return Math.round((new Date(caducidad + 'T00:00:00').getTime() - hoy.setHours(0, 0, 0, 0)) / dia)
}
