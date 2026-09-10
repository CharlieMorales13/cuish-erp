import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { renderConProviders, screen, userEvent, waitFor, within } from '@/shared/test/render'
import ProveedoresPage from './index'

describe('<ProveedoresPage>', () => {
  it('lista los proveedores', async () => {
    renderConProviders(<ProveedoresPage />)
    const tabla = await screen.findByRole('table', { name: 'Proveedores' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(db.proveedores.length + 1)
  })

  it('marca a quién se le deben envases y deja en blanco a los demás', async () => {
    renderConProviders(<ProveedoresPage />)

    const conCascos = (await screen.findByRole('cell', { name: /Modelo/ })).closest('tr')!
    expect(within(conCascos).getByText('10 sin devolver')).toBeInTheDocument()

    const sinCascos = screen.getByRole('cell', { name: /La Noria/ }).closest('tr')!
    expect(within(sinCascos).getByText('—')).toBeInTheDocument()
  })

  it('editar un proveedor guarda el cambio', async () => {
    const user = userEvent.setup()
    renderConProviders(<ProveedoresPage />)

    await user.click(await screen.findByRole('cell', { name: /La Noria/ }))
    const dialogo = await screen.findByRole('dialog')
    await user.clear(within(dialogo).getByLabelText('Teléfono'))
    await user.type(within(dialogo).getByLabelText('Teléfono'), '951 000 0000')
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(db.proveedores.find((p) => p.id === 'PRV-01')!.telefono).toBe('951 000 0000'),
    )
  })

  it('no deja guardar un proveedor sin nombre', async () => {
    const user = userEvent.setup()
    renderConProviders(<ProveedoresPage />)

    await user.click(await screen.findByRole('button', { name: 'Nuevo proveedor' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Nuevo proveedor' })

    expect(within(dialogo).getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })
})
