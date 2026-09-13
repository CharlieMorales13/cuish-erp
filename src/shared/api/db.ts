// Servidor falso. Es la ÚNICA pieza del proyecto que sabe que hoy no hay backend:
// mantiene las tablas en memoria y simula la latencia de la red.
//
// Cuando exista la API real (Supabase / Fastify), este archivo se reemplaza por un
// cliente HTTP y `contracts.ts` pasa a generarse desde el esquema. Ninguna entidad,
// feature o pantalla cambia: todas hablan con las funciones de `entities/*/api.ts`.

import type {
  Compra,
  Conteo,
  Insumo,
  Lote,
  Movimiento,
  Proveedor,
  Receta,
  Venta,
} from './contracts'
import { INSUMOS } from './seed/insumos'
import { RECETAS } from './seed/recetas'
import { COMPRAS, CONTEOS, LOTES, MOVIMIENTOS, PROVEEDORES, VENTAS } from './seed'

const semilla = () => ({
  insumos: structuredClone(INSUMOS) as Insumo[],
  recetas: structuredClone(RECETAS) as Receta[],
  lotes: structuredClone(LOTES) as Lote[],
  movimientos: structuredClone(MOVIMIENTOS) as Movimiento[],
  proveedores: structuredClone(PROVEEDORES) as Proveedor[],
  compras: structuredClone(COMPRAS) as Compra[],
  ventas: structuredClone(VENTAS) as Venta[],
  conteos: structuredClone(CONTEOS) as Conteo[],
})

export let db = semilla()

/** Devuelve la base a su estado inicial. Lo usan los tests para partir siempre de lo mismo. */
export function resetDb() {
  db = semilla()
  secuencia = 0
}

/** Latencia simulada. Clona la respuesta para que nadie mute la "base" por referencia. */
export const delay = <T>(data: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms))

let secuencia = 0

/** Id secuencial legible. En la BD real es `gen_random_uuid()`. */
export const nuevoId = (prefijo: string) => `${prefijo}-${String(++secuencia).padStart(5, '0')}`

export const ahora = () => new Date().toISOString()
export const hoy = () => ahora().slice(0, 10)

/** Usuario de la sesión. Mientras no exista autenticación real, es fijo. */
export const USUARIO = 'Gerente'
