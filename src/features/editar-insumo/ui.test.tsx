import { describe, expect, it, vi } from 'vitest'
import { db } from '@/shared/api/db'
import { renderConProviders, screen, userEvent, waitFor } from '@/shared/test/render'
import { ModalEditarInsumo, insumoVacio } from './ui'

const mezcal = () => db.insumos.find((i) => i.id === 'INS-01')!

describe('<ModalEditarInsumo>', () => {
  it('precarga los datos del insumo que se edita', () => {
    renderConProviders(<ModalEditarInsumo insumo={mezcal()} onCerrar={vi.fn()} />)

    expect(screen.getByLabelText('Nombre')).toHaveValue('Mezcal')
    expect(screen.getByLabelText('Categoría')).toHaveValue('Destilados')
    expect(screen.getByLabelText('Unidad de uso')).toHaveValue('ml')
  })

  it('calcula el costo unitario en vivo mientras se captura', async () => {
    const user = userEvent.setup()
    renderConProviders(<ModalEditarInsumo insumo={insumoVacio()} onCerrar={vi.fn()} />)

    await user.clear(screen.getByLabelText(/Presentación de compra/))
    await user.type(screen.getByLabelText(/Presentación de compra/), '750')
    await user.type(screen.getByLabelText('Costo de la presentación'), '665')

    expect(await screen.findByText(/\$0\.89 \/ ml/)).toBeInTheDocument()
  })

  it('no guarda con presentación cero y explica por qué', async () => {
    const user = userEvent.setup()
    const onCerrar = vi.fn()
    renderConProviders(<ModalEditarInsumo insumo={insumoVacio()} onCerrar={onCerrar} />)

    await user.type(screen.getByLabelText('Nombre'), 'Whisky')
    await user.type(screen.getByLabelText('Categoría'), 'Destilados')
    await user.clear(screen.getByLabelText(/Presentación de compra/))
    await user.type(screen.getByLabelText(/Presentación de compra/), '0')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('La presentación debe ser mayor a cero')).toBeInTheDocument()
    expect(onCerrar).not.toHaveBeenCalled()
  })

  it('no deja un máximo por debajo del mínimo', async () => {
    const user = userEvent.setup()
    renderConProviders(<ModalEditarInsumo insumo={mezcal()} onCerrar={vi.fn()} />)

    await user.clear(screen.getByLabelText('Existencia máxima'))
    await user.type(screen.getByLabelText('Existencia máxima'), '10')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El máximo no puede ser menor al mínimo')).toBeInTheDocument()
  })

  it('guarda derivando el costo unitario, no copiando el de compra', async () => {
    const user = userEvent.setup()
    const onCerrar = vi.fn()
    renderConProviders(<ModalEditarInsumo insumo={mezcal()} onCerrar={onCerrar} />)

    await user.clear(screen.getByLabelText('Costo de la presentación'))
    await user.type(screen.getByLabelText('Costo de la presentación'), '200')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(onCerrar).toHaveBeenCalled())
    expect(mezcal().costoUnitario).toBeCloseTo(200 / 1000, 6)
  })

  it('cancelar cierra sin tocar el catálogo', async () => {
    const user = userEvent.setup()
    const onCerrar = vi.fn()
    const costoAntes = mezcal().costoCompra
    renderConProviders(<ModalEditarInsumo insumo={mezcal()} onCerrar={onCerrar} />)

    await user.clear(screen.getByLabelText('Costo de la presentación'))
    await user.type(screen.getByLabelText('Costo de la presentación'), '999')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCerrar).toHaveBeenCalled()
    expect(mezcal().costoCompra).toBe(costoAntes)
  })
})
