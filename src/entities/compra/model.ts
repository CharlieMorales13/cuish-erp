import type { Compra, LineaCompra } from '@/shared/api/contracts'

export const totalCompra = (lineas: LineaCompra[]) =>
  lineas.reduce((total, l) => total + l.presentaciones * l.costoCompra, 0)

export const cascosPendientes = (compra: Compra) => compra.cascosPrestados - compra.cascosDevueltos

/** Envases prestados sin devolver, contando solo compras ya recibidas. */
export const cascosVivos = (compras: Compra[]) =>
  compras.reduce((s, c) => s + (c.estado === 'recibida' ? cascosPendientes(c) : 0), 0)
