import type { Conteo, LineaConteo } from '@/shared/api/contracts'

export const capturadas = (lineas: LineaConteo[]) => lineas.filter((l) => l.fisico !== null)

export const conDiferencia = (lineas: LineaConteo[]) =>
  capturadas(lineas).filter((l) => l.fisico !== l.teorico)

export const diferencia = (linea: LineaConteo) =>
  linea.fisico === null ? null : Number((linea.fisico - linea.teorico).toFixed(4))

/** Cuánto mueve el conteo el valor del inventario, en pesos. */
export function impactoValor(lineas: LineaConteo[], costoUnitario: (insumoId: string) => number) {
  return conDiferencia(lineas).reduce(
    (s, l) => s + (diferencia(l) ?? 0) * costoUnitario(l.insumoId),
    0,
  )
}

export const avance = (conteo: Conteo) =>
  `${capturadas(conteo.lineas).length} / ${conteo.lineas.length}`
