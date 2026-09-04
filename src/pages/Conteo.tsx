import { useEffect, useState } from 'react'
import { Aviso, Badge, Button, Card, Cargando, Page } from '../ui'
import { cantidad, fechaConHora, money } from '../lib'
import type { Conteo as ConteoT, LineaConteo } from '../domain/types'
import {
  useCerrarConteo, useConteos, useCrearConteo, useGuardarConteo, useInsumosById,
} from '../hooks'

export default function Conteo() {
  const { data: conteos } = useConteos()
  const crear = useCrearConteo()
  const [activoId, setActivoId] = useState<string | null>(null)

  const activo = conteos?.find((c) => c.id === activoId) ?? null

  if (!conteos) return <Cargando />

  return (
    <Page
      titulo="Conteo físico"
      descripcion="Corte contra existencia física. Al cerrar, las diferencias se registran como ajustes."
      acciones={
        <Button
          variante="primary"
          disabled={crear.isPending}
          onClick={async () => setActivoId((await crear.mutateAsync()).id)}
        >
          Nuevo conteo
        </Button>
      }
    >
      {activo ? (
        <Captura conteo={activo} onSalir={() => setActivoId(null)} />
      ) : (
        <Card className="divide-y divide-zinc-100">
          {conteos.map((c) => (
            <button
              key={c.id}
              onClick={() => setActivoId(c.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50"
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-sm text-zinc-900">{c.folio}</span>
                <span className="text-sm text-zinc-500">{fechaConHora(c.fecha)}</span>
              </span>
              <span className="flex items-center gap-3 text-sm text-zinc-500">
                {c.lineas.filter((l) => l.fisico !== null).length} / {c.lineas.length} capturados
                <Badge tono={c.estado === 'cerrado' ? 'ok' : 'warn'}>{c.estado}</Badge>
              </span>
            </button>
          ))}
          {conteos.length === 0 && <p className="px-4 py-10 text-center text-sm text-zinc-500">Sin conteos registrados.</p>}
        </Card>
      )}
    </Page>
  )
}

function Captura({ conteo, onSalir }: { conteo: ConteoT; onSalir: () => void }) {
  const insumos = useInsumosById()
  const guardar = useGuardarConteo()
  const cerrar = useCerrarConteo()
  const [lineas, setLineas] = useState<LineaConteo[]>(conteo.lineas)

  useEffect(() => setLineas(conteo.lineas), [conteo.id, conteo.lineas])

  const bloqueado = conteo.estado === 'cerrado'
  const capturadas = lineas.filter((l) => l.fisico !== null)
  const conDiferencia = capturadas.filter((l) => l.fisico !== l.teorico)
  const impacto = conDiferencia.reduce(
    (s, l) => s + (l.fisico! - l.teorico) * (insumos[l.insumoId]?.costoUnitario ?? 0), 0)

  const setFisico = (insumoId: string, v: string) =>
    setLineas((prev) => prev.map((l) => l.insumoId === insumoId ? { ...l, fisico: v === '' ? null : Number(v) } : l))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button onClick={onSalir}>← Volver</Button>
          <span className="font-mono text-sm text-zinc-900">{conteo.folio}</span>
          <Badge tono={bloqueado ? 'ok' : 'warn'}>{conteo.estado}</Badge>
        </div>
        {!bloqueado && (
          <div className="flex gap-2">
            <Button onClick={() => guardar.mutate({ conteoId: conteo.id, lineas })} disabled={guardar.isPending}>
              Guardar avance
            </Button>
            <Button
              variante="primary"
              disabled={cerrar.isPending || capturadas.length === 0}
              onClick={async () => {
                await guardar.mutateAsync({ conteoId: conteo.id, lineas })
                await cerrar.mutateAsync(conteo.id)
              }}
            >
              Cerrar y ajustar
            </Button>
          </div>
        )}
      </div>

      {!bloqueado && conDiferencia.length > 0 && (
        <Aviso>
          {conDiferencia.length} insumo{conDiferencia.length > 1 ? 's' : ''} con diferencia.
          Impacto en valor de inventario: <strong>{money(impacto)}</strong>.
          Al cerrar se generan los ajustes correspondientes.
        </Aviso>
      )}

      <Card className="overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <th className="px-3 py-2 text-left font-medium">Insumo</th>
              <th className="px-3 py-2 text-right font-medium">Teórico</th>
              <th className="px-3 py-2 text-right font-medium">Físico</th>
              <th className="px-3 py-2 text-right font-medium">Diferencia</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l) => {
              const insumo = insumos[l.insumoId]
              const dif = l.fisico === null ? null : l.fisico - l.teorico
              return (
                <tr key={l.insumoId} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-1.5">{insumo?.nombre ?? l.insumoId}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-zinc-500">{cantidad(l.teorico, insumo?.unidad)}</td>
                  <td className="px-3 py-1.5 text-right">
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      disabled={bloqueado}
                      value={l.fisico ?? ''}
                      onChange={(e) => setFisico(l.insumoId, e.target.value)}
                      aria-label={`Existencia física de ${insumo?.nombre}`}
                      className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-right tabular-nums focus:border-zinc-900 focus:outline-none disabled:bg-zinc-100"
                    />
                  </td>
                  <td className={`px-3 py-1.5 text-right tabular-nums ${dif && dif < 0 ? 'text-red-600' : dif ? 'text-emerald-700' : 'text-zinc-400'}`}>
                    {dif === null ? '—' : `${dif > 0 ? '+' : ''}${cantidad(dif)}`}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-zinc-500">
                    {dif === null ? '—' : money(dif * (insumo?.costoUnitario ?? 0))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
