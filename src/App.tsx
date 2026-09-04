import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import {
  Boxes, ClipboardList, ClipboardCheck, FlaskConical, LayoutDashboard, LogOut,
  Package, Receipt, ShoppingCart, Truck,
} from 'lucide-react'
import { Button, Card, Field, Input } from './ui'
import { cn } from './lib'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Lotes from './pages/Lotes'
import Movimientos from './pages/Movimientos'
import Conteo from './pages/Conteo'
import Insumos from './pages/Insumos'
import Recetas from './pages/Recetas'
import Compras from './pages/Compras'
import Proveedores from './pages/Proveedores'
import Ventas from './pages/Ventas'

// ponytail: sesión falsa en sessionStorage, un solo rol. Cuando entre el backend,
// esto se cambia por el token real y aquí se agregan roles si el cliente los pide.
const SESION = 'cuish.usuario'
const usuario = () => sessionStorage.getItem(SESION)

const NAV = [
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

function Login() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('Gerente')
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-100 px-4">
      <Card className="w-full max-w-sm p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Cuish</p>
        <h1 className="mt-1 text-lg font-semibold text-zinc-900">ERP de inventario</h1>
        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            sessionStorage.setItem(SESION, nombre || 'Gerente')
            navigate('/')
          }}
        >
          <Field label="Usuario">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </Field>
          <Field label="Contraseña" hint="Autenticación pendiente de definir con el backend.">
            <Input type="password" defaultValue="demo" />
          </Field>
          <Button variante="primary" type="submit" className="mt-1 w-full">Entrar</Button>
        </form>
      </Card>
    </div>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  if (!usuario()) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Cuish</p>
          <p className="text-sm font-semibold text-zinc-900">ERP de inventario</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm',
                isActive ? 'bg-zinc-900 font-medium text-white' : 'text-zinc-600 hover:bg-zinc-100',
              )}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-2">
          <p className="px-2.5 py-1 text-xs text-zinc-500">{usuario()}</p>
          <Button
            variante="ghost"
            className="w-full justify-start"
            onClick={() => { sessionStorage.removeItem(SESION); navigate('/login') }}
          >
            <LogOut size={16} /> Salir
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {[
        ['/', <Dashboard />], ['/inventario', <Inventario />], ['/lotes', <Lotes />],
        ['/movimientos', <Movimientos />], ['/conteo', <Conteo />], ['/insumos', <Insumos />],
        ['/recetas', <Recetas />], ['/compras', <Compras />], ['/proveedores', <Proveedores />],
        ['/ventas', <Ventas />],
      ].map(([path, el]) => (
        <Route key={path as string} path={path as string} element={<Layout>{el}</Layout>} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
