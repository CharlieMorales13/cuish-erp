import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, userEvent } from '@/shared/test/render'
import { ErrorBoundary } from './error-boundary'

function Explota({ falla }: { falla: boolean }) {
  if (falla) throw new Error('Algo se rompió al dibujar')
  return <p>contenido</p>
}

beforeEach(() => {
  // React imprime el error atrapado; el ruido no aporta al reporte de pruebas.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('<ErrorBoundary>', () => {
  it('deja pasar el contenido cuando nada falla', () => {
    render(
      <ErrorBoundary>
        <Explota falla={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('atrapa el error del render en vez de dejar la pantalla en blanco', () => {
    render(
      <ErrorBoundary>
        <Explota falla />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Algo se rompió al dibujar')
    expect(screen.getByText('La pantalla no se pudo dibujar')).toBeInTheDocument()
  })

  it('reintentar vuelve a montar el contenido', async () => {
    const user = userEvent.setup()

    function App() {
      return (
        <ErrorBoundary>
          <Explota falla={false} />
        </ErrorBoundary>
      )
    }

    const { rerender } = render(
      <ErrorBoundary>
        <Explota falla />
      </ErrorBoundary>,
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    rerender(<App />)

    expect(screen.getByText('contenido')).toBeInTheDocument()
  })
})
