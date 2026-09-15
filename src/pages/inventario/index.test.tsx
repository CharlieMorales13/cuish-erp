import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { bajoMinimo } from '@/entities/insumo'
import { existencia } from '@/entities/lote'
import { renderConProviders, screen, within } from '@/shared/test/render'
import InventarioPage from './index'

const filaDe = async (nombre: string) => {
  const celda = await screen.findByRole('cell', { name: nombre })
  return celda.closest('tr')!
}

describe('<InventarioPage>', () => {
  it('muestra una fila por insumo del catálogo', async () => {
    renderConProviders(<InventarioPage />)

    const tabla = await screen.findByRole('table', { name: 'Existencias por insumo' })
    // +1 por el encabezado
    expect(within(tabla).getAllByRole('row')).toHaveLength(db.insumos.length + 1)
  })

  it('separa botella cerrada de copeo, y deja en blanco lo que no es botella', async () => {
    renderConProviders(<InventarioPage />)

    const mezcal = await filaDe('Espadín Joven') // esBotella: true
    expect(within(mezcal).getAllByRole('cell')[3]).not.toHaveTextContent('—')

    const hielo = await filaDe('Hielo') // esBotella: false
    expect(within(hielo).getAllByRole('cell')[3]).toHaveTextContent('—')
  })

  it('marca Agotado el insumo sin existencia', async () => {
    db.lotes = db.lotes.filter((l) => l.insumoId !== 'INS-01')
    renderConProviders(<InventarioPage />)

    const mezcal = await filaDe('Espadín Joven')
    expect(within(mezcal).getByText('Agotado')).toBeInTheDocument()
  })

  it('marca Bajo mínimo cuando la existencia no llega al mínimo', async () => {
    db.lotes = db.lotes.filter((l) => l.insumoId !== 'INS-01')
    const insumo = db.insumos.find((i) => i.id === 'INS-01')!
    db.lotes.push({
      id: 'L-test',
      insumoId: 'INS-01',
      estado: 'abierta',
      restante: insumo.min - 1,
      inicial: insumo.min,
      recibido: '2026-01-01',
      costoUnitario: 0.15,
    })

    renderConProviders(<InventarioPage />)

    const mezcal = await filaDe('Espadín Joven')
    expect(within(mezcal).getByText('Bajo mínimo')).toBeInTheDocument()
  })

  it('en el mínimo exacto, el contador y la fila dicen lo mismo', async () => {
    // La regla vive en `bajoMinimo`. Cuando la pantalla la reimplementaba, el badge de la
    // fila decía "Bajo mínimo" y el contador de arriba no la contaba: la misma pantalla se
    // contradecía justo en el umbral.
    const insumo = db.insumos.find((i) => i.id === 'INS-01')!
    db.lotes = db.lotes.filter((l) => l.insumoId !== 'INS-01')
    db.lotes.push({
      id: 'L-min',
      insumoId: 'INS-01',
      estado: 'abierta',
      restante: insumo.min,
      inicial: insumo.min,
      recibido: '2026-01-01',
      costoUnitario: insumo.costoUnitario,
    })

    const esperados = db.insumos.filter((i) => bajoMinimo(existencia(db.lotes, i.id), i)).length

    renderConProviders(<InventarioPage />)

    const fila = await filaDe('Espadín Joven')
    expect(within(fila).getByText('Bajo mínimo')).toBeInTheDocument()

    const aviso = await screen.findByText(/por debajo de la existencia mínima/)
    expect(aviso).toHaveTextContent(new RegExp(`^${esperados} insumos? `))
  })

  it('avisa cuántos insumos están por debajo del mínimo', async () => {
    renderConProviders(<InventarioPage />)
    expect(await screen.findByText(/por debajo de la existencia mínima/)).toBeInTheDocument()
  })

  it('sin insumos bajo mínimo no muestra el aviso', async () => {
    db.insumos.forEach((i) => (i.min = 0))
    renderConProviders(<InventarioPage />)

    await screen.findByRole('table', { name: 'Existencias por insumo' })
    expect(screen.queryByText(/por debajo de la existencia mínima/)).not.toBeInTheDocument()
  })

  it('muestra el estado de carga antes de que llegue la respuesta', () => {
    renderConProviders(<InventarioPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
  })
})
