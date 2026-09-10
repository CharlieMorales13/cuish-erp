import { describe, expect, it } from 'vitest'
import { db } from '@/shared/api/db'
import { sembrarVentasAplicadas } from '@/features/aplicar-venta'
import { renderConProviders, screen } from '@/shared/test/render'
import DashboardPage from './index'

describe('<DashboardPage>', () => {
  it('avisa cuántas ventas del POS faltan por descontar', async () => {
    const pendientes = db.ventas.filter((v) => !v.aplicada).length
    renderConProviders(<DashboardPage />)

    expect(await screen.findByText(/ventas del POS pendientes/)).toHaveTextContent(
      String(pendientes),
    )
  })

  it('sin pendientes no muestra ese aviso', async () => {
    db.ventas.forEach((v) => (v.aplicada = true))
    renderConProviders(<DashboardPage />)

    await screen.findByText('Valor del inventario')
    expect(screen.queryByText(/ventas del POS pendientes/)).not.toBeInTheDocument()
  })

  it('muestra los cuatro indicadores de cabecera', async () => {
    renderConProviders(<DashboardPage />)

    expect(await screen.findByText('Valor del inventario')).toBeInTheDocument()
    expect(screen.getByText('Bajo mínimo')).toBeInTheDocument()
    expect(screen.getByText(/Por caducar/)).toBeInTheDocument()
    expect(screen.getByText('Ventas sin aplicar')).toBeInTheDocument()
  })

  it('sin consumo registrado la gráfica lo dice en vez de quedarse vacía', async () => {
    renderConProviders(<DashboardPage />)

    expect(await screen.findByText('Consumo por insumo (costo)')).toBeInTheDocument()
    expect(screen.getByText('Sin mermas registradas')).toBeInTheDocument()
  })

  it('con el kardex sembrado ya hay consumo que graficar', async () => {
    sembrarVentasAplicadas()
    renderConProviders(<DashboardPage />)

    await screen.findByText('Consumo por insumo (costo)')
    expect(screen.queryByText('Sin datos')).not.toBeInTheDocument()
  })
})
