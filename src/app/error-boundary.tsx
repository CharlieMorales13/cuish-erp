import { Component, type ErrorInfo, type ReactNode } from 'react'
import { PanelError } from '@/shared/ui'

interface Props {
  children: ReactNode
}

interface State {
  error: unknown
}

/**
 * Última red de seguridad: atrapa los errores que revientan durante el render.
 *
 * Los errores de datos los manejan las pantallas con `EstadoConsulta`, y los de acciones
 * salen por los avisos. Esto es para lo que ninguno de los dos cubre — un bug nuestro que
 * tira el árbol de React — para que el usuario vea algo útil en vez de una pantalla blanca.
 *
 * Tiene que ser una clase: React todavía no ofrece equivalente en hooks.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // Cuando haya telemetría, este es el punto donde se reporta.
    console.error('Error no controlado en el render:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center bg-zinc-50 p-4">
        <PanelError
          titulo="La pantalla no se pudo dibujar"
          error={this.state.error}
          onReintentar={() => this.setState({ error: null })}
        />
      </div>
    )
  }
}
