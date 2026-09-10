import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { cn } from '../lib/cn'
import { Card } from './superficies'
import { control } from './form'

export interface Columna<T> {
  key: string
  header: string
  /** Valor con el que se ordena y se filtra. Sin él, la columna no ordena ni busca. */
  valor?: (fila: T) => string | number
  render?: (fila: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}

type Orden = { key: string; desc: boolean }

/** Ordena por el `valor` de la columna: numérico si ambos lo son, si no `localeCompare` es-MX. */
export function ordenar<T>(filas: T[], columnas: Array<Columna<T>>, orden: Orden | null): T[] {
  if (!orden) return filas
  const col = columnas.find((c) => c.key === orden.key)
  if (!col?.valor) return filas
  const valor = col.valor
  return [...filas].sort((a, b) => {
    const va = valor(a)
    const vb = valor(b)
    const cmp =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'es-MX')
    return orden.desc ? -cmp : cmp
  })
}

export function filtrar<T>(filas: T[], columnas: Array<Columna<T>>, texto: string): T[] {
  const q = texto.trim().toLowerCase()
  if (!q) return filas
  const conValor = columnas.filter((c) => c.valor)
  return filas.filter((f) => conValor.some((c) => String(c.valor!(f)).toLowerCase().includes(q)))
}

const alinea = (a?: string) =>
  a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

export function DataTable<T>({
  datos,
  columnas,
  rowKey,
  buscar = true,
  vacio = 'Sin registros',
  onRowClick,
  etiqueta,
}: {
  datos: T[]
  columnas: Array<Columna<T>>
  rowKey: (fila: T) => string
  buscar?: boolean
  vacio?: string
  onRowClick?: (fila: T) => void
  etiqueta?: string
}) {
  const [q, setQ] = useState('')
  const [orden, setOrden] = useState<Orden | null>(null)

  const filas = useMemo(
    () => ordenar(filtrar(datos, columnas, q), columnas, orden),
    [datos, columnas, q, orden],
  )

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
          <table className="w-full border-collapse text-sm" aria-label={etiqueta}>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                {columnas.map((c) => (
                  <th
                    key={c.key}
                    aria-sort={
                      orden?.key === c.key ? (orden.desc ? 'descending' : 'ascending') : undefined
                    }
                    className={cn(
                      'px-3 py-2 font-medium text-zinc-600',
                      alinea(c.align),
                      c.className,
                    )}
                  >
                    {c.valor ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOrden((o) =>
                            o?.key === c.key
                              ? { key: c.key, desc: !o.desc }
                              : { key: c.key, desc: false },
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-zinc-900"
                      >
                        {c.header}
                        {orden?.key === c.key &&
                          (orden.desc ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr
                  key={rowKey(fila)}
                  onClick={onRowClick ? () => onRowClick(fila) : undefined}
                  className={cn(
                    'border-b border-zinc-100 last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-zinc-50',
                  )}
                >
                  {columnas.map((c) => (
                    <td
                      key={c.key}
                      className={cn('px-3 py-2 text-zinc-800', alinea(c.align), c.className)}
                    >
                      {c.render ? c.render(fila) : String(c.valor?.(fila) ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td
                    colSpan={columnas.length}
                    className="px-3 py-8 text-center text-sm text-zinc-500"
                  >
                    {vacio}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
