import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { renderConProviders, screen, userEvent, within } from '@/shared/test/render'
import InsumosPage from './index'

describe('<InsumosPage>', () => {
  it('lista el catálogo completo', async () => {
    renderConProviders(<InsumosPage />)
    const tabla = await screen.findByRole('table', { name: 'Catálogo de insumos' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(db.insumos.length + 1)
  })

  it('muestra con 3 decimales los costos por debajo del centavo', async () => {
    renderConProviders(<InsumosPage />)
    // el hielo cuesta $0.0048/g: con 2 decimales se vería como $0.00
    const hielo = (await screen.findByRole('cell', { name: 'Hielo' })).closest('tr')!
    expect(within(hielo).getByText(/\$0\.005/)).toBeInTheDocument()
  })

  it('marca qué insumos se controlan por copeo y cuáles caducan', async () => {
    renderConProviders(<InsumosPage />)

    const mezcal = (await screen.findByRole('cell', { name: 'Espadín Joven' })).closest('tr')!
    expect(within(mezcal).getByText('copeo')).toBeInTheDocument()

    const jarabe = screen.getByRole('cell', { name: 'Concentrado de jamaica' }).closest('tr')!
    expect(within(jarabe).getByText('caduca')).toBeInTheDocument()
  })

  it('dice cuántos tragos rinde una botella', async () => {
    renderConProviders(<InsumosPage />)

    // 750 ml de Espadín a 2 oz (59.15 ml) por trago
    const mezcal = (await screen.findByRole('cell', { name: 'Espadín Joven' })).closest('tr')!
    expect(within(mezcal).getByText(/12\.7/)).toBeInTheDocument()

    // lo que no se sirve derecho no rinde caballitos
    const hielo = screen.getByRole('cell', { name: 'Hielo' }).closest('tr')!
    expect(within(hielo).getAllByText('—').length).toBeGreaterThan(0)
  })

  it('abre el formulario al tocar una fila', async () => {
    const user = userEvent.setup()
    renderConProviders(<InsumosPage />)

    await user.click(await screen.findByRole('cell', { name: 'Espadín Joven' }))
    expect(await screen.findByRole('dialog', { name: 'Editar Espadín Joven' })).toBeInTheDocument()
  })

  it('la búsqueda filtra el catálogo', async () => {
    const user = userEvent.setup()
    renderConProviders(<InsumosPage />)

    await user.type(await screen.findByLabelText('Buscar en la tabla'), 'agua de sol')
    const tabla = screen.getByRole('table', { name: 'Catálogo de insumos' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(3) // encabezado + jamaica + tamarindo
  })
})
