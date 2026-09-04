// Primitivas de UI. Deliberadamente mínimas y sin dependencias: el diseño real
// llega después, con la identidad visual de Cuish. Diálogo y select son nativos,
// que ya traen foco, escape y accesibilidad resueltos.
import {
  createContext, useContext, useEffect, useId, useMemo, useRef, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { cn } from './lib'

// ---------------------------------------------------------------- botón

type Variante = 'primary' | 'outline' | 'ghost' | 'danger'

const variantes: Record<Variante, string> = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-400',
  outline: 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
}

export function Button({
  variante = 'outline', className, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900',
        variantes[variante], className,
      )}
    />
  )
}

// ---------------------------------------------------------------- superficies

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-lg border border-zinc-200 bg-white', className)}>{children}</div>
}

export function Page({ titulo, descripcion, acciones, children }: {
  titulo: string; descripcion?: string; acciones?: ReactNode; children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{titulo}</h1>
          {descripcion && <p className="mt-0.5 text-sm text-zinc-500">{descripcion}</p>}
        </div>
        {acciones && <div className="flex gap-2">{acciones}</div>}
      </header>
      {children}
    </div>
  )
}

const tonos = {
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
}

export function Badge({ tono = 'neutral', children }: { tono?: keyof typeof tonos; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset', tonos[tono])}>
      {children}
    </span>
  )
}

export function Aviso({ tono = 'warn', children }: { tono?: keyof typeof tonos; children: ReactNode }) {
  return (
    <div className={cn('rounded-md px-3 py-2 text-sm ring-1 ring-inset', tonos[tono])}>{children}</div>
  )
}

export function Stat({ label, valor, nota, tono }: {
  label: string; valor: ReactNode; nota?: string; tono?: keyof typeof tonos
}) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums', tono === 'danger' ? 'text-red-600' : 'text-zinc-900')}>
        {valor}
      </p>
      {nota && <p className="mt-0.5 text-xs text-zinc-500">{nota}</p>}
    </Card>
  )
}

// ---------------------------------------------------------------- formulario

const FieldCtx = createContext<string>('')

export function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: ReactNode
}) {
  const id = useId()
  return (
    <FieldCtx.Provider value={id}>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-xs font-medium text-zinc-700">{label}</label>
        {children}
        {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </FieldCtx.Provider>
  )
}

const control =
  'w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none disabled:bg-zinc-100'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const id = useContext(FieldCtx)
  return <input id={id || undefined} {...props} className={cn(control, className)} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useContext(FieldCtx)
  return <select id={id || undefined} {...props} className={cn(control, className)} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useContext(FieldCtx)
  return <textarea id={id || undefined} {...props} className={cn(control, className)} />
}

// ---------------------------------------------------------------- diálogo

export function Modal({ abierto, onCerrar, titulo, children, ancho = 'max-w-lg' }: {
  abierto: boolean; onCerrar: () => void; titulo: string; children: ReactNode; ancho?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => { if (e.target === ref.current) onCerrar() }}
      className={cn('w-[calc(100vw-2rem)] rounded-lg p-0 backdrop:bg-zinc-900/40', ancho)}
    >
      {abierto && (
        <div className="flex max-h-[80vh] flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">{titulo}</h2>
            <Button variante="ghost" onClick={onCerrar} aria-label="Cerrar" className="px-1.5">
              <X size={16} />
            </Button>
          </div>
          <div className="overflow-y-auto p-4">{children}</div>
        </div>
      )}
    </dialog>
  )
}

// ---------------------------------------------------------------- tabla

export interface Columna<T> {
  key: string
  header: string
  /** valor usado para ordenar y filtrar; si falta, la columna no ordena */
  valor?: (fila: T) => string | number
  render?: (fila: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}

export function DataTable<T>({ datos, columnas, rowKey, buscar = true, vacio = 'Sin registros', onRowClick }: {
  datos: T[]
  columnas: Array<Columna<T>>
  rowKey: (fila: T) => string
  buscar?: boolean
  vacio?: string
  onRowClick?: (fila: T) => void
}) {
  const [q, setQ] = useState('')
  const [orden, setOrden] = useState<{ key: string; desc: boolean } | null>(null)

  const filas = useMemo(() => {
    const texto = q.trim().toLowerCase()
    const conValor = columnas.filter((c) => c.valor)
    let out = datos
    if (texto) {
      out = out.filter((f) => conValor.some((c) => String(c.valor!(f)).toLowerCase().includes(texto)))
    }
    if (orden) {
      const col = columnas.find((c) => c.key === orden.key)
      if (col?.valor) {
        out = [...out].sort((a, b) => {
          const va = col.valor!(a), vb = col.valor!(b)
          const cmp = typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : String(va).localeCompare(String(vb), 'es-MX')
          return orden.desc ? -cmp : cmp
        })
      }
    }
    return out
  }, [datos, columnas, q, orden])

  const alinea = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left')

  return (
    <div className="flex flex-col gap-2">
      {buscar && (
        <div className="relative w-72">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar en la tabla"
            className={cn(control, 'pl-8')}
          />
        </div>
      )}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                {columnas.map((c) => (
                  <th key={c.key} className={cn('px-3 py-2 font-medium text-zinc-600', alinea(c.align), c.className)}>
                    {c.valor ? (
                      <button
                        type="button"
                        onClick={() => setOrden((o) => (o?.key === c.key ? { key: c.key, desc: !o.desc } : { key: c.key, desc: false }))}
                        className="inline-flex items-center gap-1 hover:text-zinc-900"
                      >
                        {c.header}
                        {orden?.key === c.key && (orden.desc ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                      </button>
                    ) : c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr
                  key={rowKey(fila)}
                  onClick={onRowClick ? () => onRowClick(fila) : undefined}
                  className={cn('border-b border-zinc-100 last:border-0', onRowClick && 'cursor-pointer hover:bg-zinc-50')}
                >
                  {columnas.map((c) => (
                    <td key={c.key} className={cn('px-3 py-2 text-zinc-800', alinea(c.align), c.className)}>
                      {c.render ? c.render(fila) : String(c.valor?.(fila) ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={columnas.length} className="px-3 py-8 text-center text-sm text-zinc-500">{vacio}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function Cargando() {
  return <div className="py-16 text-center text-sm text-zinc-500">Cargando…</div>
}
