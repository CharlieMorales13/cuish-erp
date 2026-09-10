import { Badge, Card } from '@/shared/ui'
import { cantidad, diasParaCaducar } from '@/shared/lib'
import type { Existencia, Insumo, Lote } from '@/shared/api/contracts'

export const DIAS_ALERTA_CADUCIDAD = 15

export function lotesPorCaducar(lotes: Lote[], dias = DIAS_ALERTA_CADUCIDAD) {
  return lotes
    .filter((l) => l.estado !== 'agotada' && l.caducidad)
    .map((lote) => ({ lote, dias: diasParaCaducar(lote.caducidad)! }))
    .filter((x) => x.dias <= dias)
    .sort((a, b) => a.dias - b.dias)
}

export function ListaBajoMinimo({
  insumos,
  existencias,
  limite = 10,
}: {
  insumos: Insumo[]
  existencias: Record<string, Existencia>
  limite?: number
}) {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Bajo existencia mínima</h2>
      <ul className="mt-3 flex flex-col divide-y divide-zinc-100">
        {insumos.slice(0, limite).map((i) => (
          <li key={i.id} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-zinc-800">{i.nombre}</span>
            <span className="flex items-center gap-2 tabular-nums text-zinc-500">
              {cantidad(existencias[i.id]?.total ?? 0, i.unidad)}
              <Badge tono="danger">mín {cantidad(i.min)}</Badge>
            </span>
          </li>
        ))}
        {insumos.length === 0 && (
          <li className="py-6 text-center text-sm text-zinc-500">Todo por encima del mínimo.</li>
        )}
      </ul>
    </Card>
  )
}

export function ListaPorCaducar({
  lotes,
  nombreDe,
  limite = 10,
}: {
  lotes: Array<{ lote: Lote; dias: number }>
  nombreDe: (insumoId: string) => string
  limite?: number
}) {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Lotes próximos a caducar</h2>
      <ul className="mt-3 flex flex-col divide-y divide-zinc-100">
        {lotes.slice(0, limite).map(({ lote, dias }) => (
          <li key={lote.id} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-zinc-800">
              {nombreDe(lote.insumoId)}
              <span className="ml-2 text-xs text-zinc-400">{lote.id}</span>
            </span>
            <Badge tono={dias < 0 ? 'danger' : dias <= 7 ? 'warn' : 'neutral'}>
              {dias < 0 ? `caducado hace ${-dias} d` : `${dias} días`}
            </Badge>
          </li>
        ))}
        {lotes.length === 0 && (
          <li className="py-6 text-center text-sm text-zinc-500">
            Nada caduca en los próximos {DIAS_ALERTA_CADUCIDAD} días.
          </li>
        )}
      </ul>
    </Card>
  )
}
