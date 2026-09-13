import type { ReactNode } from 'react'
import { NavLink, Navigate, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib'
import { cerrarSesion, usuarioActual } from '@/features/auth'
import { NAVEGACION } from './rutas'

export function LayoutErp({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const usuario = usuarioActual()

  if (!usuario) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Cuish</p>
          <p className="text-sm font-semibold text-zinc-900">ERP de inventario</p>
        </div>
        <nav aria-label="Módulos" className="flex-1 overflow-y-auto p-2">
          {NAVEGACION.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm',
                  isActive
                    ? 'bg-zinc-900 font-medium text-white'
                    : 'text-zinc-600 hover:bg-zinc-100',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-2">
          <p className="px-2.5 py-1 text-xs text-zinc-500">{usuario}</p>
          <Button
            variante="ghost"
            className="w-full justify-start"
            onClick={() => {
              cerrarSesion()
              navigate('/login')
            }}
          >
            <LogOut size={16} /> Salir
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  )
}
