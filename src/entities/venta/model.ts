import type { Venta } from '@/shared/api/contracts'

export const totalVentas = (ventas: Venta[]) => ventas.reduce((s, v) => s + v.total, 0)

export const pendientesDeAplicar = (ventas: Venta[]) => ventas.filter((v) => !v.aplicada)

export const productosEnTicket = (venta: Venta) => venta.lineas.reduce((s, l) => s + l.cantidad, 0)
