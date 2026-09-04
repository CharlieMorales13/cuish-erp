// Capa de datos. Hoy vive en memoria; el día que exista backend real solo cambian
// los cuerpos de estas funciones por `fetch`. Ningún componente se entera.
// El estado se reinicia al recargar la página: es un mockup funcional, no persistencia.

import { INSUMOS } from '../data/insumos'
import { RECETAS } from '../data/recetas'
import { COMPRAS, CONTEOS, LOTES, MOVIMIENTOS, PROVEEDORES, VENTAS } from '../data/seed'
import { byId, consumirPeps, existencias, explotarVenta } from '../domain/inventario'
import type {
  Compra, Conteo, Insumo, LineaCompra, Lote, Movimiento, Proveedor, Receta, Venta,
} from '../domain/types'

const USUARIO = 'Gerente'

const db = {
  insumos: structuredClone(INSUMOS),
  recetas: structuredClone(RECETAS),
  lotes: structuredClone(LOTES),
  movimientos: structuredClone(MOVIMIENTOS),
  proveedores: structuredClone(PROVEEDORES),
  compras: structuredClone(COMPRAS),
  ventas: structuredClone(VENTAS),
  conteos: structuredClone(CONTEOS),
}

const delay = <T>(data: T): Promise<T> =>
  new Promise((r) => setTimeout(() => r(structuredClone(data)), 120))

let secuencia = Date.now() % 100000
const id = (prefijo: string) => `${prefijo}-${String(++secuencia).padStart(5, '0')}`
const ahora = () => new Date().toISOString()

function mover(m: Omit<Movimiento, 'id' | 'fecha' | 'usuario'> & Partial<Movimiento>) {
  db.movimientos.unshift({ id: id('MOV'), fecha: ahora(), usuario: USUARIO, ...m })
}

/** Aplica una cantidad (con signo) sobre un lote y lo marca agotado al llegar a cero. */
function afectarLote(lote: Lote, cantidad: number) {
  lote.restante = Number((lote.restante + cantidad).toFixed(4))
  if (lote.estado !== 'cerrada' && lote.restante <= 0) lote.estado = 'agotada'
}

/** Crea los lotes que corresponden a una entrada de mercancía. RF-ERP-07 (conversión). */
function ingresar(
  insumo: Insumo,
  presentaciones: number,
  costoCompra: number,
  meta: { proveedorId?: string; marbete?: string; caducidad?: string; ref?: string },
): Lote[] {
  const costoUnitario = costoCompra / insumo.presentacion
  const nuevos: Lote[] = []
  if (insumo.esBotella) {
    // cada botella es una partida propia: entra cerrada y se abre después
    for (let i = 0; i < presentaciones; i++) {
      nuevos.push({
        id: id('LOT'), insumoId: insumo.id, estado: 'cerrada',
        restante: insumo.presentacion, inicial: insumo.presentacion,
        marbete: presentaciones === 1 ? meta.marbete : undefined,
        caducidad: insumo.caduca ? meta.caducidad : undefined,
        recibido: ahora().slice(0, 10), proveedorId: meta.proveedorId, costoUnitario,
      })
    }
  } else {
    const cantidad = presentaciones * insumo.presentacion
    nuevos.push({
      id: id('LOT'), insumoId: insumo.id, estado: 'abierta',
      restante: cantidad, inicial: cantidad,
      caducidad: insumo.caduca ? meta.caducidad : undefined,
      recibido: ahora().slice(0, 10), proveedorId: meta.proveedorId, costoUnitario,
    })
  }
  db.lotes.push(...nuevos)
  for (const lote of nuevos) {
    mover({ tipo: 'entrada', insumoId: insumo.id, loteId: lote.id, cantidad: lote.inicial, motivo: 'Recepción de mercancía', ref: meta.ref })
  }
  return nuevos
}

// ---------------------------------------------------------------- catálogo

export const getInsumos = () => delay(db.insumos)
export const getRecetas = () => delay(db.recetas)
export const getProveedores = () => delay(db.proveedores)
export const getLotes = () => delay(db.lotes)
export const getMovimientos = () => delay(db.movimientos)
export const getCompras = () => delay(db.compras)
export const getVentas = () => delay(db.ventas)
export const getConteos = () => delay(db.conteos)
export const getExistencias = () => delay(existencias(db.lotes, db.insumos))

export async function guardarInsumo(insumo: Insumo) {
  const i = db.insumos.findIndex((x) => x.id === insumo.id)
  const normalizado = { ...insumo, costoUnitario: insumo.costoCompra / insumo.presentacion }
  if (i >= 0) db.insumos[i] = normalizado
  else db.insumos.push({ ...normalizado, id: id('INS') })
  return delay(normalizado)
}

export async function guardarReceta(receta: Receta) {
  const i = db.recetas.findIndex((x) => x.id === receta.id)
  if (i >= 0) db.recetas[i] = receta
  else db.recetas.push({ ...receta, id: id('REC') })
  return delay(receta)
}

export async function guardarProveedor(proveedor: Proveedor) {
  const i = db.proveedores.findIndex((x) => x.id === proveedor.id)
  if (i >= 0) db.proveedores[i] = proveedor
  else db.proveedores.push({ ...proveedor, id: id('PRV') })
  return delay(proveedor)
}

// ---------------------------------------------------------------- inventario

export async function registrarEntrada(input: {
  insumoId: string
  presentaciones: number
  costoCompra: number
  proveedorId?: string
  marbete?: string
  caducidad?: string
}) {
  const insumo = db.insumos.find((i) => i.id === input.insumoId)!
  return delay(ingresar(insumo, input.presentaciones, input.costoCompra, input))
}

/** Salida, ajuste o merma manual sobre un lote concreto. RF-ERP-02, RF-ERP-03. */
export async function registrarMovimiento(input: {
  tipo: 'salida' | 'ajuste' | 'merma'
  loteId: string
  cantidad: number
  motivo: string
}) {
  const lote = db.lotes.find((l) => l.id === input.loteId)!
  const signo = input.tipo === 'ajuste' ? 1 : -1
  afectarLote(lote, signo * input.cantidad)
  mover({ tipo: input.tipo, insumoId: lote.insumoId, loteId: lote.id, cantidad: signo * input.cantidad, motivo: input.motivo })
  return delay(lote)
}

/** Botella cerrada → botella de copeo. RF-ERP-09. */
export async function abrirBotella(loteId: string) {
  const lote = db.lotes.find((l) => l.id === loteId)!
  lote.estado = 'abierta'
  mover({ tipo: 'apertura', insumoId: lote.insumoId, loteId: lote.id, cantidad: 0, motivo: `Apertura de botella${lote.marbete ? ` · marbete ${lote.marbete}` : ''}` })
  return delay(lote)
}

// ---------------------------------------------------------------- compras

export async function crearCompra(input: Omit<Compra, 'id' | 'folio' | 'estado' | 'cascosDevueltos'>) {
  const folio = id('CMP')
  const compra: Compra = { ...input, id: folio, folio, estado: 'requisicion', cascosDevueltos: 0 }
  db.compras.unshift(compra)
  return delay(compra)
}

export async function recibirCompra(compraId: string) {
  const compra = db.compras.find((c) => c.id === compraId)!
  if (compra.estado === 'recibida') return delay(compra)
  for (const linea of compra.lineas) {
    const insumo = db.insumos.find((i) => i.id === linea.insumoId)!
    ingresar(insumo, linea.presentaciones, linea.costoCompra, { proveedorId: compra.proveedorId, ref: compra.folio })
  }
  compra.estado = 'recibida'
  const proveedor = db.proveedores.find((p) => p.id === compra.proveedorId)
  if (proveedor) proveedor.cascosPrestados += compra.cascosPrestados
  return delay(compra)
}

/** Devolución de envase al proveedor (cascos). No estaba en los requisitos originales. */
export async function devolverCascos(compraId: string, cantidad: number) {
  const compra = db.compras.find((c) => c.id === compraId)!
  compra.cascosDevueltos = Math.min(compra.cascosPrestados, compra.cascosDevueltos + cantidad)
  const proveedor = db.proveedores.find((p) => p.id === compra.proveedorId)
  if (proveedor) proveedor.cascosPrestados = Math.max(0, proveedor.cascosPrestados - cantidad)
  return delay(compra)
}

// ---------------------------------------------------------------- ventas POS

export interface ResultadoAplicacion {
  venta: Venta
  /** insumos que no alcanzaron: se alerta sin bloquear (RF-ERP-13) */
  faltantes: Array<{ insumoId: string; cantidad: number }>
}

type Faltantes = ResultadoAplicacion['faltantes']

function aplicar(venta: Venta): Faltantes {
  const consumo = explotarVenta(venta, byId(db.recetas))
  const faltantes: Faltantes = []

  for (const [insumoId, cantidad] of Object.entries(consumo)) {
    const { asignaciones, faltante } = consumirPeps(db.lotes, insumoId, cantidad)
    for (const a of asignaciones) {
      const lote = db.lotes.find((l) => l.id === a.loteId)!
      afectarLote(lote, -a.cantidad)
      mover({ tipo: 'venta', insumoId, loteId: lote.id, cantidad: -a.cantidad, motivo: `Venta ${venta.folio} · ${venta.cuenta}`, ref: venta.folio })
    }
    if (faltante > 0) {
      faltantes.push({ insumoId, cantidad: faltante })
      if (asignaciones.length === 0) {
        mover({ tipo: 'venta', insumoId, cantidad: -faltante, motivo: `Venta ${venta.folio} · sin existencia`, ref: venta.folio })
      }
    }
  }

  venta.aplicada = true
  return faltantes
}

/**
 * Descuenta el inventario de una venta cerrada en el POS. RF-ERP-11.
 * Idempotente por id de venta: un reenvío no descuenta dos veces (RF-INT-02).
 */
export async function aplicarVenta(ventaId: string): Promise<ResultadoAplicacion> {
  const venta = db.ventas.find((v) => v.id === ventaId)!
  if (venta.aplicada) return delay({ venta, faltantes: [] })
  return delay({ venta, faltantes: aplicar(venta) })
}

// La semilla marca qué ventas ya venían aplicadas. Se re-aplican al arrancar para
// que el kardex y las existencias sean coherentes con ellas desde el primer render.
for (const venta of db.ventas) {
  if (!venta.aplicada) continue
  venta.aplicada = false
  aplicar(venta)
}

// ---------------------------------------------------------------- conteo físico

export async function crearConteo() {
  const ex = existencias(db.lotes, db.insumos)
  const folio = id('CTO')
  const conteo: Conteo = {
    id: folio, folio, fecha: ahora(), estado: 'abierto',
    lineas: db.insumos.map((i) => ({ insumoId: i.id, teorico: ex[i.id].total, fisico: null })),
  }
  db.conteos.unshift(conteo)
  return delay(conteo)
}

export async function guardarConteo(conteoId: string, lineas: Conteo['lineas']) {
  const conteo = db.conteos.find((c) => c.id === conteoId)!
  conteo.lineas = lineas
  return delay(conteo)
}

/** Cierra el conteo y genera los ajustes por diferencia. RF-ERP-01. */
export async function cerrarConteo(conteoId: string) {
  const conteo = db.conteos.find((c) => c.id === conteoId)!
  for (const linea of conteo.lineas) {
    if (linea.fisico === null) continue
    const diferencia = Number((linea.fisico - linea.teorico).toFixed(4))
    if (diferencia === 0) continue
    const lote = db.lotes.find((l) => l.insumoId === linea.insumoId && l.estado === 'abierta')
    if (lote) afectarLote(lote, diferencia)
    mover({
      tipo: 'conteo', insumoId: linea.insumoId, loteId: lote?.id, cantidad: diferencia,
      motivo: diferencia > 0 ? 'Sobrante en conteo físico' : 'Faltante en conteo físico', ref: conteo.folio,
    })
  }
  conteo.estado = 'cerrado'
  return delay(conteo)
}

export type { Compra, Conteo, Insumo, LineaCompra, Lote, Movimiento, Proveedor, Receta, Venta }
