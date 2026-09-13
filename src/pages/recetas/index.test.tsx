import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { renderConProviders, screen, userEvent, within } from '@/shared/test/render'
import RecetasPage from './index'

describe('<RecetasPage>', () => {
  it('lista la carta completa del POS', async () => {
    renderConProviders(<RecetasPage />)
    const tabla = await screen.findByRole('table', { name: 'Recetario' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(db.recetas.length + 1)
  })

  it('deja claro que los precios vienen del POS y las dosis son provisionales', async () => {
    renderConProviders(<RecetasPage />)
    expect(await screen.findByText(/catálogo del POS/)).toBeInTheDocument()
    expect(screen.getByText(/dosis de cada receta son provisionales/)).toBeInTheDocument()
  })

  it('el trago derecho es una receta de un solo ingrediente', async () => {
    renderConProviders(<RecetasPage />)

    const trago = (await screen.findByRole('cell', { name: 'Espadín Joven - Trago 2 oz' })).closest(
      'tr',
    )!
    // columna 3 = número de insumos
    expect(within(trago).getAllByRole('cell')[3]).toHaveTextContent('1')
  })

  it('las variantes de un mismo cóctel conviven con precios distintos', async () => {
    renderConProviders(<RecetasPage />)

    await screen.findByRole('table', { name: 'Recetario' })
    const margaritas = screen.getAllByRole('cell', { name: /^Margarita de Mezcal - / })
    expect(margaritas).toHaveLength(4)
  })

  it('el detalle muestra el BOM con su costo por ingrediente', async () => {
    const user = userEvent.setup()
    renderConProviders(<RecetasPage />)

    await user.click(await screen.findByRole('cell', { name: 'Paloma de Agave - Toronja natural' }))

    const dialogo = await screen.findByRole('dialog', { name: 'Paloma de Agave - Toronja natural' })
    expect(within(dialogo).getByText('Ingredientes (BOM)')).toBeInTheDocument()
    expect(within(dialogo).getAllByLabelText('Insumo')).toHaveLength(3)
  })

  it('quitar un ingrediente baja el costo calculado del cóctel', async () => {
    const user = userEvent.setup()
    renderConProviders(<RecetasPage />)

    await user.click(await screen.findByRole('cell', { name: 'Paloma de Agave - Toronja natural' }))
    const dialogo = await screen.findByRole('dialog')

    const antes = within(dialogo).getAllByLabelText('Insumo').length
    await user.click(within(dialogo).getAllByRole('button', { name: 'Quitar ingrediente' })[0])

    expect(within(dialogo).getAllByLabelText('Insumo')).toHaveLength(antes - 1)
  })

  it('una receta sin ingredientes avisa que no descontará inventario', async () => {
    const user = userEvent.setup()
    renderConProviders(<RecetasPage />)

    await user.click(await screen.findByRole('button', { name: 'Nueva receta' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Nueva receta' })

    expect(within(dialogo).getByText(/no descuenta inventario/)).toBeInTheDocument()
  })
})
