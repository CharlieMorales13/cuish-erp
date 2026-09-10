import { describe, expect, it } from 'vitest'
import { usuarioActual } from '@/features/auth'
import { renderConProviders, screen, userEvent } from '@/shared/test/render'
import LoginPage from './index'

describe('<LoginPage>', () => {
  it('entrar deja la sesión abierta con el usuario capturado', async () => {
    const user = userEvent.setup()
    renderConProviders(<LoginPage />)

    await user.clear(screen.getByLabelText('Usuario'))
    await user.type(screen.getByLabelText('Usuario'), 'Encargado de barra')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(usuarioActual()).toBe('Encargado de barra')
  })

  it('sin nombre entra como Gerente, que es el único rol por ahora', async () => {
    const user = userEvent.setup()
    renderConProviders(<LoginPage />)

    await user.clear(screen.getByLabelText('Usuario'))
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(usuarioActual()).toBe('Gerente')
  })

  it('dice que la autenticación real está pendiente', () => {
    renderConProviders(<LoginPage />)
    expect(screen.getByText(/Autenticación pendiente/)).toBeInTheDocument()
  })
})
