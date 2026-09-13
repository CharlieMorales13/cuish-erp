import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '@/pages/login'
import DashboardPage from '@/pages/dashboard'
import InventarioPage from '@/pages/inventario'
import LotesPage from '@/pages/lotes'
import MovimientosPage from '@/pages/movimientos'
import ConteoPage from '@/pages/conteo'
import InsumosPage from '@/pages/insumos'
import RecetasPage from '@/pages/recetas'
import ComprasPage from '@/pages/compras'
import ProveedoresPage from '@/pages/proveedores'
import VentasPage from '@/pages/ventas'
import { LayoutErp } from './layout'

const PANTALLAS: Array<[string, React.ReactElement]> = [
  ['/', <DashboardPage />],
  ['/inventario', <InventarioPage />],
  ['/lotes', <LotesPage />],
  ['/movimientos', <MovimientosPage />],
  ['/conteo', <ConteoPage />],
  ['/insumos', <InsumosPage />],
  ['/recetas', <RecetasPage />],
  ['/compras', <ComprasPage />],
  ['/proveedores', <ProveedoresPage />],
  ['/ventas', <VentasPage />],
]

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {PANTALLAS.map(([path, element]) => (
        <Route key={path} path={path} element={<LayoutErp>{element}</LayoutErp>} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
