import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { existencia } from '@/entities/lote'
import { cerrarConteo, crearConteo, guardarConteo } from './api'

describe('crearConteo', () => {
  it('congela la existencia teórica de todos los insumos del catálogo', async () => {
    const conteo = await crearConteo()

    expect(conteo.estado).toBe('abierto')
    expect(conteo.lineas).toHaveLength(db.insumos.length)
    expect(conteo.lineas.every((l) => l.fisico === null)).toBe(true)

    const mezcal = conteo.lineas.find((l) => l.insumoId === 'INS-01')!
    expect(mezcal.teorico).toBeCloseTo(existencia(db.lotes, 'INS-01').total, 4)
  })
})

describe('cerrarConteo', () => {
  it('genera un ajuste por cada diferencia y no toca lo que cuadra', async () => {
    const conteo = await crearConteo()
    const teorico = conteo.lineas.find((l) => l.insumoId === 'INS-01')!.teorico

    await guardarConteo({
      conteoId: conteo.id,
      lineas: conteo.lineas.map((l) =>
        l.insumoId === 'INS-01' ? { ...l, fisico: teorico - 50 } : { ...l, fisico: l.teorico },
      ),
    })

    const movimientosAntes = db.movimientos.length
    await cerrarConteo(conteo.id)

    const ajustes = db.movimientos.slice(0, db.movimientos.length - movimientosAntes)
    expect(ajustes).toHaveLength(1)
    expect(ajustes[0]).toMatchObject({ tipo: 'conteo', insumoId: 'INS-01', cantidad: -50 })
    expect(ajustes[0].motivo).toMatch(/Faltante/)
  })

  it('corrige la existencia teórica hasta la contada', async () => {
    const conteo = await crearConteo()
    const teorico = existencia(db.lotes, 'INS-01').total

    await guardarConteo({
      conteoId: conteo.id,
      lineas: conteo.lineas.map((l) =>
        l.insumoId === 'INS-01' ? { ...l, fisico: teorico - 50 } : l,
      ),
    })
    await cerrarConteo(conteo.id)

    expect(existencia(db.lotes, 'INS-01').total).toBeCloseTo(teorico - 50, 4)
  })

  it('un sobrante suma y se etiqueta como tal', async () => {
    const conteo = await crearConteo()
    const linea = conteo.lineas.find((l) => l.insumoId === 'INS-01')!

    await guardarConteo({
      conteoId: conteo.id,
      lineas: conteo.lineas.map((l) =>
        l.insumoId === 'INS-01' ? { ...l, fisico: linea.teorico + 30 } : l,
      ),
    })
    await cerrarConteo(conteo.id)

    expect(db.movimientos[0]).toMatchObject({ tipo: 'conteo', cantidad: 30 })
    expect(db.movimientos[0].motivo).toMatch(/Sobrante/)
  })

  it('ignora las líneas que nunca se capturaron', async () => {
    const conteo = await crearConteo()
    const movimientosAntes = db.movimientos.length

    await cerrarConteo(conteo.id)

    expect(db.movimientos.length).toBe(movimientosAntes)
    expect(db.conteos.find((c) => c.id === conteo.id)!.estado).toBe('cerrado')
  })

  it('revienta con un conteo que no existe', async () => {
    await expect(cerrarConteo('no-existe')).rejects.toThrow(/Conteo desconocido/)
  })
})
