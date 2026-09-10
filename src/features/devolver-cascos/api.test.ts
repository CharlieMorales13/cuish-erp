import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { recibirCompra } from '@/features/recibir-mercancia'
import { devolverCascos } from './api'

// CMP-001 es la compra de Modelo: 10 cascos prestados, ninguno devuelto.
const COMPRA = 'CMP-001'
const proveedorDe = (compraId: string) => {
  const compra = db.compras.find((c) => c.id === compraId)!
  return db.proveedores.find((p) => p.id === compra.proveedorId)!
}

describe('devolverCascos', () => {
  it('descuenta del adeudo de la compra y del proveedor', async () => {
    const prestados = proveedorDe(COMPRA).cascosPrestados

    await devolverCascos({ compraId: COMPRA, cantidad: 4 })

    expect(db.compras.find((c) => c.id === COMPRA)!.cascosDevueltos).toBe(4)
    expect(proveedorDe(COMPRA).cascosPrestados).toBe(prestados - 4)
  })

  it('no deja devolver más de lo prestado', async () => {
    await devolverCascos({ compraId: COMPRA, cantidad: 999 })
    const compra = db.compras.find((c) => c.id === COMPRA)!
    expect(compra.cascosDevueltos).toBe(compra.cascosPrestados)
    expect(proveedorDe(COMPRA).cascosPrestados).toBe(0)
  })

  it('devolver de más no deja el adeudo del proveedor en negativo', async () => {
    await devolverCascos({ compraId: COMPRA, cantidad: 5 })
    await devolverCascos({ compraId: COMPRA, cantidad: 5 })
    await devolverCascos({ compraId: COMPRA, cantidad: 5 })
    expect(proveedorDe(COMPRA).cascosPrestados).toBe(0)
  })

  it('recibir una requisición suma los cascos que presta el proveedor', async () => {
    const requisicion = db.compras.find((c) => c.estado === 'requisicion')!
    requisicion.cascosPrestados = 6
    const antes = db.proveedores.find((p) => p.id === requisicion.proveedorId)!.cascosPrestados

    await recibirCompra(requisicion.id)

    expect(db.proveedores.find((p) => p.id === requisicion.proveedorId)!.cascosPrestados).toBe(
      antes + 6,
    )
  })

  it('recibir dos veces la misma compra no duplica el inventario', async () => {
    const requisicion = db.compras.find((c) => c.estado === 'requisicion')!
    await recibirCompra(requisicion.id)
    const lotes = db.lotes.length
    await recibirCompra(requisicion.id)
    expect(db.lotes.length).toBe(lotes)
  })
})
