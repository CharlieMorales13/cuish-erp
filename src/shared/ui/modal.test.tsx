import { describe, expect, it, vi } from 'vitest'
import { render, screen, userEvent } from '../test/render'
import { Modal } from './modal'

describe('<Modal>', () => {
  it('cerrado no monta su contenido', () => {
    render(
      <Modal abierto={false} onCerrar={vi.fn()} titulo="Recepción">
        <p>contenido</p>
      </Modal>,
    )
    expect(screen.queryByText('contenido')).not.toBeInTheDocument()
  })

  it('abierto muestra título y contenido', () => {
    render(
      <Modal abierto onCerrar={vi.fn()} titulo="Recepción">
        <p>contenido</p>
      </Modal>,
    )
    expect(screen.getByRole('heading', { name: 'Recepción' })).toBeInTheDocument()
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('el diálogo lleva nombre accesible', () => {
    render(
      <Modal abierto onCerrar={vi.fn()} titulo="Recepción">
        <p>contenido</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Recepción' })).toBeInTheDocument()
  })

  it('la equis avisa que hay que cerrar', async () => {
    const user = userEvent.setup()
    const onCerrar = vi.fn()
    render(
      <Modal abierto onCerrar={onCerrar} titulo="Recepción">
        <p>contenido</p>
      </Modal>,
    )

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onCerrar).toHaveBeenCalled()
  })

  it('el evento `close` del diálogo nativo (Escape) también avisa', () => {
    const onCerrar = vi.fn()
    render(
      <Modal abierto onCerrar={onCerrar} titulo="Recepción">
        <p>contenido</p>
      </Modal>,
    )

    screen.getByRole('dialog').dispatchEvent(new Event('close'))
    expect(onCerrar).toHaveBeenCalled()
  })
})
