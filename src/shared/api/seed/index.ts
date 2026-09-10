import type { Compra, Conteo, Lote, Movimiento, Proveedor, Venta } from '../contracts'
import { INSUMOS } from './insumos'
import { RECETAS } from './recetas'

// PLACEHOLDER: proveedores, existencias iniciales, lotes, marbetes, compras, conteos
// y ventas son inventados. Ningún documento del cliente los trae. Sustituir con el
// inventario inicial real antes del arranque productivo (RF-ERP-01).

export const PROVEEDORES: Proveedor[] = [
  {
    id: 'PRV-01',
    nombre: 'Distribuidora La Noria',
    contacto: 'Elena Ruiz',
    telefono: '951 512 3344',
    cascosPrestados: 0,
  },
  {
    id: 'PRV-02',
    nombre: 'Cervecería Modelo Oaxaca',
    contacto: 'Sergio Nava',
    telefono: '951 514 8890',
    cascosPrestados: 10,
  },
  {
    id: 'PRV-03',
    nombre: 'Mezcales de Santiago Matatlán',
    contacto: 'Doña Rufina',
    telefono: '951 588 2211',
    cascosPrestados: 0,
  },
  {
    id: 'PRV-04',
    nombre: 'Central de Abastos — Frutas Ríos',
    contacto: 'Mostrador',
    telefono: '951 500 1177',
    cascosPrestados: 0,
  },
]

const hoy = new Date()
const fecha = (diasAtras: number) => {
  const d = new Date(hoy)
  d.setDate(d.getDate() - diasAtras)
  return d.toISOString().slice(0, 10)
}
const futuro = (dias: number) => fecha(-dias)

let n = 0
const nuevoLote = (p: Omit<Lote, 'id'>): Lote => ({
  id: `LOT-${String(++n).padStart(3, '0')}`,
  ...p,
})

const marbete = (i: number) => `M${String(70000000000 + i * 137).padStart(11, '0')}`

// Un lote abierto por insumo (lo que está en la barra) + botellas cerradas en almacén.
export const LOTES: Lote[] = INSUMOS.flatMap((insumo, idx) => {
  const proveedorId =
    insumo.categoria === 'Perecederos'
      ? 'PRV-04'
      : insumo.id === 'INS-01'
        ? 'PRV-03'
        : insumo.categoria === 'Mezcladores'
          ? 'PRV-02'
          : 'PRV-01'
  const caducidad = insumo.caduca ? futuro([3, 12, 40, 90][idx % 4]) : undefined

  const abierto = nuevoLote({
    insumoId: insumo.id,
    estado: 'abierta',
    restante: Number((insumo.presentacion * (0.3 + ((idx * 7) % 6) / 10)).toFixed(2)),
    inicial: insumo.presentacion,
    marbete: insumo.esBotella ? marbete(idx) : undefined,
    caducidad,
    recibido: fecha(20 + (idx % 10)),
    proveedorId,
    costoUnitario: insumo.costoUnitario,
  })

  const cerradas = insumo.esBotella
    ? Array.from({ length: (idx % 3) + 1 }, (_, k) =>
        nuevoLote({
          insumoId: insumo.id,
          estado: 'cerrada',
          restante: insumo.presentacion,
          inicial: insumo.presentacion,
          marbete: marbete(idx * 10 + k + 1),
          caducidad,
          recibido: fecha(5 + k),
          proveedorId,
          costoUnitario: insumo.costoUnitario,
        }),
      )
    : [
        nuevoLote({
          insumoId: insumo.id,
          estado: 'abierta',
          restante: insumo.presentacion * ((idx % 4) + 1),
          inicial: insumo.presentacion * ((idx % 4) + 1),
          caducidad,
          recibido: fecha(4),
          proveedorId,
          costoUnitario: insumo.costoUnitario,
        }),
      ]

  return [abierto, ...cerradas]
})

export const MOVIMIENTOS: Movimiento[] = LOTES.slice(0, 24).map((lote, i) => ({
  id: `MOV-${String(i + 1).padStart(4, '0')}`,
  fecha: lote.recibido + 'T10:30:00',
  tipo: 'entrada',
  insumoId: lote.insumoId,
  loteId: lote.id,
  cantidad: lote.inicial,
  motivo: 'Inventario inicial',
  usuario: 'Gerente',
  ref: 'INV-INICIAL',
}))

export const COMPRAS: Compra[] = [
  {
    id: 'CMP-001',
    folio: 'CMP-001',
    proveedorId: 'PRV-02',
    fecha: fecha(6),
    estado: 'recibida',
    lineas: [
      { insumoId: 'INS-19', presentaciones: 24, costoCompra: 13.33 },
      { insumoId: 'INS-20', presentaciones: 24, costoCompra: 16.0 },
    ],
    cascosPrestados: 10,
    cascosDevueltos: 0,
  },
  {
    id: 'CMP-002',
    folio: 'CMP-002',
    proveedorId: 'PRV-03',
    fecha: fecha(3),
    estado: 'recibida',
    lineas: [{ insumoId: 'INS-01', presentaciones: 6, costoCompra: 150 }],
    cascosPrestados: 0,
    cascosDevueltos: 0,
  },
  {
    id: 'CMP-003',
    folio: 'CMP-003',
    proveedorId: 'PRV-01',
    fecha: fecha(0),
    estado: 'requisicion',
    lineas: [
      { insumoId: 'INS-09', presentaciones: 2, costoCompra: 990 },
      { insumoId: 'INS-08', presentaciones: 2, costoCompra: 705 },
      { insumoId: 'INS-16', presentaciones: 12, costoCompra: 188 },
    ],
    cascosPrestados: 0,
    cascosDevueltos: 0,
  },
]

const recetas = Object.fromEntries(RECETAS.map((r) => [r.id, r]))
const cuentas = [
  'Barra principal 1',
  'Barra principal 2',
  'Barra pared 1',
  'Mesa 1',
  'Barra pared 2',
]

// Ventas ya recibidas del POS. `aplicada: false` = pendiente de descontar inventario,
// que es lo que el ERP hace al cerrar la cuenta (RF-ERP-11).
export const VENTAS: Venta[] = Array.from({ length: 12 }, (_, i) => {
  const ids = [RECETAS[(i * 3) % 18].id, RECETAS[(i * 5 + 2) % 18].id]
  const lineas = ids.map((refId, k) => ({
    tipo: 'receta' as const,
    refId,
    cantidad: ((i + k) % 3) + 1,
    precio: recetas[refId].precio,
  }))
  return {
    id: `9f${String(i).padStart(2, '0')}-4a1b-8c2d-${String(1000 + i)}`,
    folio: `V-${String(1041 + i)}`,
    fecha: `${fecha(i < 9 ? 1 : 0)}T${String(20 + (i % 4)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`,
    cuenta: cuentas[i % cuentas.length],
    lineas,
    total: lineas.reduce((s, l) => s + l.precio * l.cantidad, 0),
    aplicada: i < 9,
  }
})

export const CONTEOS: Conteo[] = [
  {
    id: 'CTO-001',
    folio: 'CTO-001',
    fecha: fecha(7),
    estado: 'cerrado',
    lineas: INSUMOS.slice(0, 8).map((i) => ({
      insumoId: i.id,
      teorico: i.presentacion,
      fisico: i.presentacion,
    })),
  },
]
