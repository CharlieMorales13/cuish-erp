import { describe, expect, it, vi } from 'vitest'
import { render, screen, userEvent, within } from '../test/render'
import { DataTable, filtrar, ordenar, type Columna } from './data-table'

interface Fila {
  id: string
  nombre: string
  cantidad: number
}

const datos: Fila[] = [
  { id: '1', nombre: 'Mezcal', cantidad: 100 },
  { id: '2', nombre: 'aperol', cantidad: 30 },
  { id: '3', nombre: 'Ñandú', cantidad: 500 },
]

const columnas: Array<Columna<Fila>> = [
  { key: 'nombre', header: 'Insumo', valor: (f) => f.nombre },
  { key: 'cantidad', header: 'Cantidad', valor: (f) => f.cantidad, align: 'right' },
  { key: 'acciones', header: '', render: () => <span>—</span> },
]

const nombresVisibles = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((fila) => fila.querySelectorAll('td')[0]?.textContent)

describe('ordenar', () => {
  it('ordena números como números, no como texto', () => {
    expect(
      ordenar(datos, columnas, { key: 'cantidad', desc: false }).map((f) => f.cantidad),
    ).toEqual([30, 100, 500])
  })

  it('ordena texto con reglas de es-MX: ignora mayúsculas y acomoda la ñ', () => {
    expect(ordenar(datos, columnas, { key: 'nombre', desc: false }).map((f) => f.nombre)).toEqual([
      'aperol',
      'Mezcal',
      'Ñandú',
    ])
  })

  it('invierte con desc', () => {
    expect(
      ordenar(datos, columnas, { key: 'cantidad', desc: true }).map((f) => f.cantidad),
    ).toEqual([500, 100, 30])
  })

  it('sin orden devuelve el mismo arreglo, sin copiarlo', () => {
    expect(ordenar(datos, columnas, null)).toBe(datos)
  })

  it('una columna sin `valor` no ordena', () => {
    expect(ordenar(datos, columnas, { key: 'acciones', desc: false })).toBe(datos)
  })
})

describe('filtrar', () => {
  it('busca sin distinguir mayúsculas', () => {
    expect(filtrar(datos, columnas, 'MEZ').map((f) => f.nombre)).toEqual(['Mezcal'])
  })

  it('también busca sobre columnas numéricas', () => {
    expect(filtrar(datos, columnas, '500')).toHaveLength(1)
  })

  it('texto en blanco no filtra nada', () => {
    expect(filtrar(datos, columnas, '   ')).toBe(datos)
  })

  it('sin coincidencias devuelve vacío', () => {
    expect(filtrar(datos, columnas, 'tequila')).toEqual([])
  })
})

describe('<DataTable>', () => {
  it('pinta una fila por dato', () => {
    render(<DataTable datos={datos} columnas={columnas} rowKey={(f) => f.id} etiqueta="Insumos" />)
    expect(nombresVisibles()).toEqual(['Mezcal', 'aperol', 'Ñandú'])
  })

  it('el encabezado ordena al hacer clic y alterna al segundo clic', async () => {
    const user = userEvent.setup()
    render(<DataTable datos={datos} columnas={columnas} rowKey={(f) => f.id} />)

    await user.click(screen.getByRole('button', { name: /Cantidad/ }))
    expect(nombresVisibles()).toEqual(['aperol', 'Mezcal', 'Ñandú'])

    await user.click(screen.getByRole('button', { name: /Cantidad/ }))
    expect(nombresVisibles()).toEqual(['Ñandú', 'Mezcal', 'aperol'])
  })

  it('anuncia el sentido del orden a lectores de pantalla', async () => {
    const user = userEvent.setup()
    render(<DataTable datos={datos} columnas={columnas} rowKey={(f) => f.id} />)

    await user.click(screen.getByRole('button', { name: /Cantidad/ }))
    expect(screen.getByRole('columnheader', { name: /Cantidad/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
  })

  it('el buscador filtra las filas visibles', async () => {
    const user = userEvent.setup()
    render(<DataTable datos={datos} columnas={columnas} rowKey={(f) => f.id} />)

    await user.type(screen.getByLabelText('Buscar en la tabla'), 'mezcal')
    expect(nombresVisibles()).toEqual(['Mezcal'])
  })

  it('muestra el mensaje de vacío cuando nada coincide', async () => {
    const user = userEvent.setup()
    render(<DataTable datos={datos} columnas={columnas} rowKey={(f) => f.id} vacio="Sin insumos" />)

    await user.type(screen.getByLabelText('Buscar en la tabla'), 'whisky')
    expect(screen.getByText('Sin insumos')).toBeInTheDocument()
  })

  it('sin `buscar` no pinta el campo de búsqueda', () => {
    render(<DataTable datos={datos} columnas={columnas} rowKey={(f) => f.id} buscar={false} />)
    expect(screen.queryByLabelText('Buscar en la tabla')).not.toBeInTheDocument()
  })

  it('avisa qué fila se tocó cuando la tabla es clicable', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(
      <DataTable datos={datos} columnas={columnas} rowKey={(f) => f.id} onRowClick={onRowClick} />,
    )

    await user.click(screen.getByText('Mezcal'))
    expect(onRowClick).toHaveBeenCalledWith(datos[0])
  })
})
