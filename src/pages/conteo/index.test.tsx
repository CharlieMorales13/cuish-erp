import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { existencia } from '@/entities/lote'
import { renderConProviders, screen, userEvent, waitFor, within } from '@/shared/test/render'
import ConteoPage from './index'

const abrirNuevoConteo = async () => {
  const user = userEvent.setup()
  renderConProviders(<ConteoPage />)
  await user.click(await screen.findByRole('button', { name: 'Nuevo conteo' }))
  await screen.findByRole('table', { name: 'Captura de conteo físico' })
  return user
}

describe('<ConteoPage>', () => {
  it('lista los conteos previos con su avance', async () => {
    renderConProviders(<ConteoPage />)
    expect(await screen.findByText(db.conteos[0].folio)).toBeInTheDocument()
    expect(screen.getByText('cerrado')).toBeInTheDocument()
  })

  it('un conteo nuevo abre la captura con todos los insumos', async () => {
    await abrirNuevoConteo()
    const tabla = screen.getByRole('table', { name: 'Captura de conteo físico' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(db.insumos.length + 1)
  })

  it('capturar un físico distinto al teórico calcula la diferencia y su valor', async () => {
    const user = await abrirNuevoConteo()
    const teorico = existencia(db.lotes, 'INS-01').total

    // El nombre del insumo llega en su propia query; hasta entonces la fila se rotula con el id.
    const campo = await screen.findByLabelText('Existencia física de Espadín Joven')
    await user.type(campo, String(teorico - 50))

    expect(await screen.findByText(/1 insumo con diferencia/)).toBeInTheDocument()
  })

  it('cerrar el conteo ajusta la existencia a lo contado', async () => {
    const user = await abrirNuevoConteo()
    const teorico = existencia(db.lotes, 'INS-01').total

    await user.type(
      await screen.findByLabelText('Existencia física de Espadín Joven'),
      String(teorico - 50),
    )
    await user.click(screen.getByRole('button', { name: 'Cerrar y ajustar' }))

    await waitFor(() => expect(existencia(db.lotes, 'INS-01').total).toBeCloseTo(teorico - 50, 4))
  })

  it('un conteo cerrado ya no se puede editar', async () => {
    const user = userEvent.setup()
    renderConProviders(<ConteoPage />)

    await user.click(await screen.findByText(db.conteos[0].folio))
    await screen.findByRole('table', { name: 'Captura de conteo físico' })

    expect(screen.queryByRole('button', { name: 'Cerrar y ajustar' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('spinbutton')[0]).toBeDisabled()
  })

  it('no deja cerrar un conteo sin nada capturado', async () => {
    await abrirNuevoConteo()
    expect(screen.getByRole('button', { name: 'Cerrar y ajustar' })).toBeDisabled()
  })
})
