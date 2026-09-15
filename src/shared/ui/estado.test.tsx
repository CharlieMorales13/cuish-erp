import { describe, expect, it, vi } from 'vitest'
import { render, screen, userEvent } from '../test/render'
import { Cargando, EstadoConsulta, PanelError, type EstadoDeConsulta } from './estado'

const consulta = (p: Partial<EstadoDeConsulta> = {}): EstadoDeConsulta => ({
  isError: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
  ...p,
})

describe('<Cargando>', () => {
  it('se anuncia a lectores de pantalla', () => {
    render(<Cargando />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
  })
})

describe('<PanelError>', () => {
  it('muestra el mensaje del error', () => {
    render(<PanelError error={new Error('No hay conexión con el servidor.')} />)
    expect(screen.getByRole('alert')).toHaveTextContent('No hay conexión con el servidor.')
  })

  it('da un mensaje genérico cuando lo lanzado no es un Error', () => {
    render(<PanelError error={undefined} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.')
  })

  it('sin manejador no ofrece reintentar', () => {
    render(<PanelError error={new Error('x')} />)
    expect(screen.queryByRole('button', { name: /Reintentar/ })).not.toBeInTheDocument()
  })

  it('reintentar avisa', async () => {
    const user = userEvent.setup()
    const onReintentar = vi.fn()
    render(<PanelError error={new Error('x')} onReintentar={onReintentar} />)

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalled()
  })

  it('mientras reintenta lo dice y no deja volver a picarle', () => {
    render(<PanelError error={new Error('x')} onReintentar={vi.fn()} reintentando />)
    expect(screen.getByRole('button', { name: /Reintentando/ })).toBeDisabled()
  })
})

describe('<EstadoConsulta>', () => {
  it('sin errores es solo el estado de carga', () => {
    render(<EstadoConsulta consultas={[consulta(), consulta()]} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('con una consulta fallida muestra el error, no un cargando eterno', () => {
    render(
      <EstadoConsulta
        consultas={[consulta(), consulta({ isError: true, error: new Error('Se cayó la red') })]}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Se cayó la red')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('reintentar solo vuelve a pedir lo que falló', async () => {
    const user = userEvent.setup()
    const ok = consulta()
    const falla = consulta({ isError: true, error: new Error('x') })
    render(<EstadoConsulta consultas={[ok, falla]} />)

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(falla.refetch).toHaveBeenCalled()
    expect(ok.refetch).not.toHaveBeenCalled()
  })
})
