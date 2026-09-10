import { hoy } from '@/shared/api/db'
import type { Insumo, Lote } from '@/shared/api/contracts'
import { insertarLote } from '@/entities/lote'
import { registrarMovimiento } from '@/entities/movimiento'
import { costoUnitario as calcularCostoUnitario } from '@/entities/insumo'

export interface DatosEntrada {
  proveedorId?: string
  marbete?: string
  caducidad?: string
  /** Folio de la compra que originó la entrada, si viene de una. */
  ref?: string
  motivo?: string
}

/**
 * Crea las partidas de inventario de una entrada de mercancía y asienta su kardex.
 *
 * Es el único lugar donde nace un lote: lo usan tanto la recepción libre como la
 * recepción de una compra, para que la conversión de unidades (RF-ERP-07) y el
 * movimiento de entrada no puedan divergir entre las dos.
 */
export function ingresar(
  insumo: Insumo,
  presentaciones: number,
  costoCompra: number,
  datos: DatosEntrada = {},
): Lote[] {
  const costoUnitario = calcularCostoUnitario(costoCompra, insumo.presentacion)
  const caducidad = insumo.caduca ? datos.caducidad : undefined
  const nuevos: Lote[] = []

  if (insumo.esBotella) {
    // Cada botella es una partida propia: entra cerrada y se abre después.
    // El marbete solo se asigna cuando entra una sola, porque es único por botella.
    for (let i = 0; i < presentaciones; i++) {
      nuevos.push(
        insertarLote({
          insumoId: insumo.id,
          estado: 'cerrada',
          restante: insumo.presentacion,
          inicial: insumo.presentacion,
          marbete: presentaciones === 1 ? datos.marbete : undefined,
          caducidad,
          recibido: hoy(),
          proveedorId: datos.proveedorId,
          costoUnitario,
        }),
      )
    }
  } else {
    const cantidad = presentaciones * insumo.presentacion
    nuevos.push(
      insertarLote({
        insumoId: insumo.id,
        estado: 'abierta',
        restante: cantidad,
        inicial: cantidad,
        caducidad,
        recibido: hoy(),
        proveedorId: datos.proveedorId,
        costoUnitario,
      }),
    )
  }

  for (const lote of nuevos) {
    registrarMovimiento({
      tipo: 'entrada',
      insumoId: insumo.id,
      loteId: lote.id,
      cantidad: lote.inicial,
      motivo: datos.motivo ?? 'Recepción de mercancía',
      ref: datos.ref,
    })
  }

  return nuevos
}

/** Cuántas piezas entran según se compre por pieza o por caja. RF-ERP-07. */
export const piezasDeCompra = (
  presentaciones: number,
  unidad: 'pieza' | 'caja',
  piezasPorCaja?: number,
) => presentaciones * (unidad === 'caja' && piezasPorCaja ? piezasPorCaja : 1)
