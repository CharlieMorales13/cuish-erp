import { describe, expect, it } from 'vitest'
import { simularFalla } from '@/shared/api/db'
import { renderConProviders, screen, userEvent, waitFor } from '@/shared/test/render'
import InventarioPage from './index'

// El backend falso nunca se cae, y por eso el camino de error es el que se queda sin
// escribir. `simularFalla` provoca el fallo para poder probarlo de verdad.

describe('<InventarioPage> cuando la consulta falla', () => {
  it('muestra el error en vez de quedarse en "Cargando…" para siempre', async () => {
    simularFalla('No hay conexión con el servidor.')
    renderConProviders(<InventarioPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('ofrece reintentar, y al reintentar carga bien', async () => {
    const user = userEvent.setup()
    simularFalla('Se cayó la red')
    renderConProviders(<InventarioPage />)

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }))

    // La falla se consume en la primera llamada, así que el reintento ya trae datos.
    expect(await screen.findByRole('table', { name: 'Existencias por insumo' })).toBeInTheDocument()
  })

  it('sin falla la pantalla carga normal', async () => {
    renderConProviders(<InventarioPage />)
    await waitFor(() =>
      expect(screen.getByRole('table', { name: 'Existencias por insumo' })).toBeInTheDocument(),
    )
  })
})
