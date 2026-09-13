import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
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
