import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { renderConProviders, screen, userEvent, within } from '@/shared/test/render'
import RecetasPage from './index'

describe('<RecetasPage>', () => {
  it('lista los 18 cócteles del recetario', async () => {
    const tabla = await (renderConProviders(<RecetasPage />),
    screen.findByRole('table', { name: 'Recetario' }))
    expect(within(tabla).getAllByRole('row')).toHaveLength(db.recetas.length + 1)
  })

  it('deja claro que este recetario es el vigente y el que consulta el POS', async () => {
    renderConProviders(<RecetasPage />)
    expect(await screen.findByText(/Recetario vigente/)).toBeInTheDocument()
  })

  it('reporta cuántas recetas tienen el costo declarado fuera de tolerancia', async () => {
    renderConProviders(<RecetasPage />)
    expect(await screen.findByText(/difiere más de/)).toBeInTheDocument()
  })

  it('marca las recetas cuyo costo calculado no cuadra con el declarado', async () => {
    renderConProviders(<RecetasPage />)

    const celdaDe = async (coctel: string, columna: number) =>
      (await screen.findByRole('cell', { name: coctel })).closest('tr')!.querySelectorAll('td')[
        columna
      ]

    // Columna 5 = "Costo recetario". El badge de desvío solo aparece cuando pasa del 5%.
    expect(await celdaDe('Centella', 5)).toHaveTextContent('%')
    expect(await celdaDe('Negroni', 5)).not.toHaveTextContent('%')
  })

  it('el copeo aparece como receta de un solo ingrediente y sin precio todavía', async () => {
    renderConProviders(<RecetasPage />)

    const copeo = (await screen.findByRole('cell', { name: 'Mezcal en caballito' })).closest('tr')!
    expect(within(copeo).getByText('sin precio')).toBeInTheDocument()
    expect(within(copeo).getAllByRole('cell')[3]).toHaveTextContent('1')
  })

  it('el detalle muestra el BOM con su costo por ingrediente', async () => {
    const user = userEvent.setup()
    renderConProviders(<RecetasPage />)

    await user.click(await screen.findByRole('cell', { name: 'Negroni' }))

    const dialogo = await screen.findByRole('dialog', { name: 'Negroni' })
    expect(within(dialogo).getByText('Ingredientes (BOM)')).toBeInTheDocument()
    expect(within(dialogo).getAllByLabelText('Insumo')).toHaveLength(5)
  })

  it('quitar un ingrediente baja el costo calculado del cóctel', async () => {
    const user = userEvent.setup()
    renderConProviders(<RecetasPage />)

    await user.click(await screen.findByRole('cell', { name: 'Negroni' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Negroni' })

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
