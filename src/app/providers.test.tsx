import { describe, expect, it } from 'vitest'
import { render, screen, userEvent, waitFor } from '@/shared/test/render'
import { useMutacionInvalidante } from '@/shared/api/mutacion'
import { AvisosDeAccion, Button } from '@/shared/ui'
import { limpiarAvisos } from '@/shared/lib'
import { Providers, crearQueryClient } from './providers'

function BotonQueFalla({ mensaje }: { mensaje: string }) {
  const accion = useMutacionInvalidante(async () => {
    throw new Error(mensaje)
  })
  return <Button onClick={() => accion.mutate(undefined)}>Intentar</Button>
}

const montar = (mensaje: string) => {
  limpiarAvisos()
  return render(
    <Providers client={crearQueryClient()}>
      <AvisosDeAccion />
      <BotonQueFalla mensaje={mensaje} />
    </Providers>,
  )
}

describe('errores de acción', () => {
  it('un fallo de mutación se avisa sin que el botón tenga que manejarlo', async () => {
    const user = userEvent.setup()
    montar('No se pudo aplicar la venta')

    await user.click(screen.getByRole('button', { name: 'Intentar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo aplicar la venta')
  })

  it('el aviso se puede descartar', async () => {
    const user = userEvent.setup()
    montar('x')

    await user.click(screen.getByRole('button', { name: 'Intentar' }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Descartar aviso' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('las mutaciones no se reintentan solas: podrían descontar inventario dos veces', () => {
    const client = crearQueryClient()
    expect(client.getDefaultOptions().mutations?.retry).toBe(false)
  })

  it('las consultas sí reintentan, porque un tropiezo de red no es una pantalla de error', () => {
    const client = crearQueryClient()
    expect(client.getDefaultOptions().queries?.retry).toBe(2)
  })
})
