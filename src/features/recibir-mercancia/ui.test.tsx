import { describe, expect, it, vi } from 'vitest'
import { db } from '@/shared/api/db'
import { existencia } from '@/entities/lote'
import { renderConProviders, screen, userEvent, waitFor } from '@/shared/test/render'
import { ModalRecibirMercancia } from './ui'

/** El catálogo llega por React Query: hay que esperar a que las opciones se pinten. */
const esperarCatalogo = () =>
  waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(5))

const abrirCon = async (insumoId: string) => {
  const user = userEvent.setup()
  renderConProviders(<ModalRecibirMercancia abierto onCerrar={vi.fn()} />)
  await esperarCatalogo()
  await user.selectOptions(screen.getByLabelText('Insumo'), insumoId)
  return user
}

describe('<ModalRecibirMercancia>', () => {
  it('pide marbete solo para lo que se controla como botella', async () => {
    const user = userEvent.setup()
    renderConProviders(<ModalRecibirMercancia abierto onCerrar={vi.fn()} />)

    await esperarCatalogo()
    await user.selectOptions(screen.getByLabelText('Insumo'), 'INS-01') // mezcal, botella
    expect(screen.getByLabelText('Marbete')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Insumo'), 'INS-17') // hielo, a granel
    expect(screen.queryByLabelText('Marbete')).not.toBeInTheDocument()
  })

  it('pide caducidad solo para lo que caduca', async () => {
    const user = await abrirCon('INS-01') // mezcal: no caduca
    expect(screen.queryByLabelText('Caducidad')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Insumo'), 'INS-24') // jarabe: sí caduca
    expect(screen.getByLabelText('Caducidad')).toBeInTheDocument()
  })

  it('al comprar por caja sugiere el tamaño del catálogo pero deja corregirlo', async () => {
    const user = await abrirCon('INS-19') // Coca: 24 por caja en el catálogo

    // Mientras se compre por pieza, el tamaño de la caja no estorba.
    expect(screen.queryByLabelText('Piezas por caja')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Unidad de compra'), 'caja')
    expect(screen.getByLabelText('Piezas por caja')).toHaveValue(24)
    expect(screen.getByText(/El catálogo sugiere 24/)).toBeInTheDocument()
  })

  it('el proveedor puede mandar otra caja y la recepción manda sobre el catálogo', async () => {
    const user = await abrirCon('INS-19')
    await user.selectOptions(screen.getByLabelText('Unidad de compra'), 'caja')

    await user.clear(screen.getByLabelText('Piezas por caja'))
    await user.type(screen.getByLabelText('Piezas por caja'), '12')
    expect(screen.getByLabelText('Piezas por caja')).toHaveValue(12)

    expect(await screen.findByText(/Entra .*ml/)).toHaveTextContent('4,260 ml') // 12 x 355 ml
  })

  it('adelanta cuánto va a entrar al almacén', async () => {
    const user = await abrirCon('INS-01')
    await user.clear(screen.getByLabelText('Cantidad'))
    await user.type(screen.getByLabelText('Cantidad'), '3')

    expect(await screen.findByText(/Entra 3 botellas cerradas de 1,000 ml/)).toBeInTheDocument()
  })

  it('convierte cajas a piezas antes de dar de alta (RF-ERP-07)', async () => {
    const user = await abrirCon('INS-19')
    await user.selectOptions(screen.getByLabelText('Unidad de compra'), 'caja')

    expect(await screen.findByText(/Entra 8,520 ml/)).toBeInTheDocument() // 24 x 355 ml
  })

  it('la cerveza ya está en el catálogo, así que los cascos tienen qué recibir', async () => {
    await abrirCon('INS-35')
    expect(await screen.findByText(/Entra 1 pz/)).toBeInTheDocument()
  })

  it('registrar la entrada sube la existencia y cierra el diálogo', async () => {
    const onCerrar = vi.fn()
    const user = userEvent.setup()
    renderConProviders(<ModalRecibirMercancia abierto onCerrar={onCerrar} />)

    await esperarCatalogo()
    await user.selectOptions(screen.getByLabelText('Insumo'), 'INS-01')
    const antes = existencia(db.lotes, 'INS-01').total

    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }))

    await waitFor(() => expect(onCerrar).toHaveBeenCalled())
    expect(existencia(db.lotes, 'INS-01').total).toBeCloseTo(antes + 1000, 4)
  })

  it('no deja registrar sin haber elegido insumo', async () => {
    renderConProviders(<ModalRecibirMercancia abierto onCerrar={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Registrar entrada' })).toBeDisabled()
  })
})
