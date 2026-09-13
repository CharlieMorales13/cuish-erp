import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '../test/render'
import { Field, Input, Select, Textarea } from './form'

describe('<Field>', () => {
  it('enlaza la etiqueta con el control, sin que la pantalla repita el id', () => {
    render(
      <Field label="Nombre">
        <Input defaultValue="Mezcal" />
      </Field>,
    )
    expect(screen.getByLabelText('Nombre')).toHaveValue('Mezcal')
  })

  it('funciona igual con un select', () => {
    render(
      <Field label="Unidad">
        <Select defaultValue="ml">
          <option value="ml">ml</option>
        </Select>
      </Field>,
    )
    expect(screen.getByLabelText('Unidad')).toHaveValue('ml')
  })

  it('el error se anuncia y queda enlazado al control', () => {
    render(
      <Field label="Costo" error="El costo debe ser mayor a cero">
        <Input />
      </Field>,
    )
    const control = screen.getByLabelText('Costo')
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(control).toHaveAccessibleDescription('El costo debe ser mayor a cero')
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('el hint desaparece cuando hay error, para no dar dos mensajes a la vez', () => {
    const { rerender } = render(
      <Field label="Costo" hint="Por presentación de compra">
        <Input />
      </Field>,
    )
    expect(screen.getByText('Por presentación de compra')).toBeInTheDocument()

    rerender(
      <Field label="Costo" hint="Por presentación de compra" error="Inválido">
        <Input />
      </Field>,
    )
    expect(screen.queryByText('Por presentación de compra')).not.toBeInTheDocument()
  })
})

describe('reenvío de ref', () => {
  it('Input, Select y Textarea entregan el nodo del DOM a quien pase una ref', () => {
    const refs = {
      input: createRef<HTMLInputElement>(),
      select: createRef<HTMLSelectElement>(),
      textarea: createRef<HTMLTextAreaElement>(),
    }
    render(
      <>
        <Input ref={refs.input} />
        <Select ref={refs.select} />
        <Textarea ref={refs.textarea} />
      </>,
    )

    // Sin esto react-hook-form no ve los campos: el formulario se pinta pero no se llena
    // ni se valida.
    expect(refs.input.current).toBeInstanceOf(HTMLInputElement)
    expect(refs.select.current).toBeInstanceOf(HTMLSelectElement)
    expect(refs.textarea.current).toBeInstanceOf(HTMLTextAreaElement)
  })
})
