export type Unidad = 'ml' | 'g' | 'pz' | 'porcion' | 'carga'

export interface Insumo {
  id: string
  nombre: string
  categoria: string
  /** cantidad que trae una presentación de compra, en `unidad` */
  presentacion: number
  /** unidad base = unidad de uso (se descuenta en esta unidad) */
  unidad: Unidad
  /** costo de una presentación de compra completa */
  costoCompra: number
  /** costoCompra / presentacion */
  costoUnitario: number
  /** true = se controla botella cerrada vs botella abierta (copeo) — RF-ERP-09 */
  esBotella: boolean
  /** true = se registra caducidad por lote — RF-ERP-06 (pendiente confirmar con cliente) */
  caduca: boolean
  /** unidades de compra por caja, si aplica — RF-ERP-07 */
  piezasPorCaja?: number
  min: number
  max: number
}

export type EstadoLote = 'cerrada' | 'abierta' | 'agotada'

/** Una partida de inventario. Botella cerrada y botella de copeo son lotes distintos. */
export interface Lote {
  id: string
  insumoId: string
  estado: EstadoLote
  /** contenido restante, en la unidad base del insumo */
  restante: number
  inicial: number
  /** identificador único de fábrica del marbete — RF-ERP-12 */
  marbete?: string
  /** ISO yyyy-mm-dd */
  caducidad?: string
  recibido: string
  proveedorId?: string
  costoUnitario: number
}

export type TipoMovimiento =
  | 'entrada' | 'salida' | 'ajuste' | 'merma' | 'apertura' | 'venta' | 'conteo'

export interface Movimiento {
  id: string
  fecha: string
  tipo: TipoMovimiento
  insumoId: string
  loteId?: string
  /** con signo: positivo suma existencia, negativo la resta */
  cantidad: number
  motivo?: string
  usuario: string
  /** folio de venta, compra o conteo que originó el movimiento */
  ref?: string
}

export interface RecetaIngrediente {
  insumoId: string
  cantidad: number
  /** cantidades de garnitura estimadas, pendientes de confirmar con el gerente */
  garnitura?: boolean
}

export interface Receta {
  id: string
  nombre: string
  cristaleria: string
  metodo: string
  garnitura: string
  precio: number
  /** costo declarado en el recetario del cliente, para contrastar contra el calculado */
  costoDoc: number
  ingredientes: RecetaIngrediente[]
}

export interface Proveedor {
  id: string
  nombre: string
  contacto: string
  telefono: string
  /** envases prestados pendientes de devolución (cascos) */
  cascosPrestados: number
}

export interface LineaCompra {
  insumoId: string
  /** número de presentaciones de compra (botellas, cajas, paquetes) */
  presentaciones: number
  costoCompra: number
}

export interface Compra {
  id: string
  folio: string
  proveedorId: string
  fecha: string
  estado: 'requisicion' | 'recibida'
  lineas: LineaCompra[]
  cascosPrestados: number
  cascosDevueltos: number
}

export interface LineaVenta {
  tipo: 'receta' | 'insumo'
  refId: string
  cantidad: number
  precio: number
}

/** Venta cerrada en el POS. El UUID lo genera el POS (RF-INT-01/02). */
export interface Venta {
  id: string
  folio: string
  fecha: string
  cuenta: string
  lineas: LineaVenta[]
  total: number
  /** true = ya descontó inventario. Se aplica al cerrar cuenta (RF-ERP-11) */
  aplicada: boolean
}

export interface LineaConteo {
  insumoId: string
  teorico: number
  fisico: number | null
}

export interface Conteo {
  id: string
  folio: string
  fecha: string
  estado: 'abierto' | 'cerrado'
  lineas: LineaConteo[]
}

export interface Existencia {
  insumoId: string
  cerrado: number
  abierto: number
  total: number
}
