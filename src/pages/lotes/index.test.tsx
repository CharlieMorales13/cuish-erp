import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { renderConProviders, screen, userEvent, waitFor, within } from '@/shared/test/render'
import LotesPage from './index'

const filaDelLote = async (loteId: string) =>
  (await screen.findByRole('cell', { name: loteId })).closest('tr')!

describe('<LotesPage>', () => {
  it('lista una fila por partida de inventario', async () => {
    renderConProviders(<LotesPage />)
    const tabla = await screen.findByRole('table', { name: 'Lotes de inventario' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(db.lotes.length + 1)
  })

  it('solo ofrece abrir botella en las partidas cerradas', async () => {
    renderConProviders(<LotesPage />)

    const cerradas = db.lotes.filter((l) => l.estado === 'cerrada').length
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Abrir botella' })).toHaveLength(cerradas),
    )
  })

  it('abrir una botella la pasa a copeo y quita el botón', async () => {
    const user = userEvent.setup()
    const cerrado = db.lotes.find((l) => l.estado === 'cerrada')!
    renderConProviders(<LotesPage />)

    const fila = await filaDelLote(cerrado.id)
    await user.click(within(fila).getByRole('button', { name: 'Abrir botella' }))

    await waitFor(() => expect(db.lotes.find((l) => l.id === cerrado.id)!.estado).toBe('abierta'))
    // La tabla se repinta con el refetch que dispara la mutación.
    await waitFor(
      () => {
        const fila = screen.getByRole('cell', { name: cerrado.id }).closest('tr')!
        expect(within(fila).getByText('Abierta / copeo')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('abrir botella deja constancia en el kardex con el marbete', async () => {
    const user = userEvent.setup()
    const cerrado = db.lotes.find((l) => l.estado === 'cerrada' && l.marbete)!
    renderConProviders(<LotesPage />)

    const fila = await filaDelLote(cerrado.id)
    await user.click(within(fila).getByRole('button', { name: 'Abrir botella' }))

    await waitFor(() => {
      const mov = db.movimientos.find((m) => m.tipo === 'apertura' && m.loteId === cerrado.id)
      expect(mov?.motivo).toContain(cerrado.marbete!)
    })
  })

  it('marca en rojo el restante negativo de un lote sobregirado', async () => {
    db.lotes[0].restante = -120
    db.lotes[0].estado = 'agotada'
    renderConProviders(<LotesPage />)

    const fila = await filaDelLote(db.lotes[0].id)
    expect(within(fila).getByText('-120', { exact: false })).toHaveClass('text-red-600')
  })

  it('lo que no maneja caducidad lo dice explícitamente', async () => {
    renderConProviders(<LotesPage />)
    expect((await screen.findAllByText('no aplica')).length).toBeGreaterThan(0)
  })
})
