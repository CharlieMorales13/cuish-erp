import {
  Boxes,
  ClipboardCheck,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  type LucideIcon,
} from 'lucide-react'

export interface Ruta {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const NAVEGACION: Ruta[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/lotes', label: 'Lotes y marbetes', icon: Package },
  { to: '/movimientos', label: 'Movimientos', icon: ClipboardList },
  { to: '/conteo', label: 'Conteo físico', icon: ClipboardCheck },
  { to: '/insumos', label: 'Insumos', icon: FlaskConical },
  { to: '/recetas', label: 'Recetas', icon: FlaskConical },
  { to: '/compras', label: 'Compras', icon: ShoppingCart },
  { to: '/proveedores', label: 'Proveedores', icon: Truck },
  { to: '/ventas', label: 'Ventas del POS', icon: Receipt },
]
