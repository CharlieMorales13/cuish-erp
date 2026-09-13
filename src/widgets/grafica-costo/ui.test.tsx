import { describe, expect, it } from 'vitest'
import { render, screen } from '@/shared/test/render'
import { GraficaCosto } from './ui'

describe('<GraficaCosto>', () => {
  it('pinta el título', () => {
    render(
      <GraficaCosto
        titulo="Consumo por insumo"
        datos={[{ nombre: 'Mezcal', costo: 100 }]}
        color="#000"
      />,
    )
    expect(screen.getByRole('heading', { name: 'Consumo por insumo' })).toBeInTheDocument()
  })

  it('sin datos muestra el mensaje de vacío en vez de una gráfica en blanco', () => {
    render(<GraficaCosto titulo="Merma" datos={[]} color="#000" vacio="Sin mermas registradas" />)
    expect(screen.getByText('Sin mermas registradas')).toBeInTheDocument()
  })
})
