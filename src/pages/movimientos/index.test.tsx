import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { renderConProviders, screen, userEvent, waitFor, within } from '@/shared/test/render'
import MovimientosPage from './index'

describe('<MovimientosPage>', () => {
  it('muestra el kardex completo', async () => {
    renderConProviders(<MovimientosPage />)
    const tabla = await screen.findByRole('table', { name: 'Kardex de movimientos' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(db.movimientos.length + 1)
  })

  it('pinta en rojo lo que resta y en verde lo que suma', async () => {
    db.movimientos[0].cantidad = -45
    db.movimientos[0].motivo = 'Merma de prueba'
    db.movimientos[1].cantidad = 30
    db.movimientos[1].motivo = 'Ajuste de prueba'

    renderConProviders(<MovimientosPage />)

    const filaDe = async (motivo: string) =>
      (await screen.findByRole('cell', { name: motivo })).closest('tr')!
    const cantidadDe = (fila: HTMLElement) => fila.querySelectorAll('td')[4].firstElementChild

    expect(cantidadDe(await filaDe('Merma de prueba'))).toHaveClass('text-red-600')
    expect(cantidadDe(await filaDe('Ajuste de prueba'))).toHaveClass('text-emerald-700')
  })

  it('el tipo de cada movimiento se distingue con su etiqueta', async () => {
    renderConProviders(<MovimientosPage />)
    expect((await screen.findAllByText('entrada')).length).toBeGreaterThan(0)
  })

  it('registrar una merma por porcentaje la convierte a cantidad', async () => {
    const user = userEvent.setup()
    renderConProviders(<MovimientosPage />)

    await user.click(await screen.findByRole('button', { name: 'Registrar movimiento' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Registrar movimiento manual' })

    await waitFor(() => expect(within(dialogo).getAllByRole('option').length).toBeGreaterThan(5))
    await user.selectOptions(within(dialogo).getByLabelText('Insumo'), 'INS-01')
    await user.selectOptions(within(dialogo).getByLabelText('Expresar como'), 'porcentaje')
    await user.type(within(dialogo).getByLabelText(/Porcentaje/), '10')

    expect(within(dialogo).getByText(/^=/)).toBeInTheDocument()
  })

  it('no deja registrar sin elegir lote', async () => {
    const user = userEvent.setup()
    renderConProviders(<MovimientosPage />)

    await user.click(await screen.findByRole('button', { name: 'Registrar movimiento' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Registrar movimiento manual' })

    expect(within(dialogo).getByRole('button', { name: 'Registrar' })).toBeDisabled()
  })
})
