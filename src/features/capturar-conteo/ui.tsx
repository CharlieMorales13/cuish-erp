import { useState } from 'react'
import { Aviso, Badge, Button, Card } from '@/shared/ui'
import { cantidad, money } from '@/shared/lib'
import type { Conteo, LineaConteo } from '@/shared/api/contracts'
import { useInsumosById } from '@/entities/insumo'
import { capturadas, conDiferencia, diferencia, impactoValor } from '@/entities/conteo'
import { useCerrarConteo, useGuardarConteo } from './api'

export function CapturaConteo({ conteo, onSalir }: { conteo: Conteo; onSalir: () => void }) {
  const insumos = useInsumosById()
  const guardar = useGuardarConteo()
  const cerrar = useCerrarConteo()
  // Estado local sembrado una sola vez. La pantalla remonta con `key={conteo.id}` al
  // cambiar de conteo, así que no hace falta un efecto que resincronice, y de paso un
  // refetch de fondo ya no puede pisar lo que el encargado lleva capturado.
  const [lineas, setLineas] = useState<LineaConteo[]>(conteo.lineas)

  const bloqueado = conteo.estado === 'cerrado'
  const diferencias = conDiferencia(lineas)
  const impacto = impactoValor(lineas, (id) => insumos[id]?.costoUnitario ?? 0)

  const setFisico = (insumoId: string, v: string) =>
    setLineas((prev) =>
      prev.map((l) =>
        l.insumoId === insumoId ? { ...l, fisico: v === '' ? null : Number(v) } : l,
      ),
    )

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
            <Button
              onClick={() => guardar.mutate({ conteoId: conteo.id, lineas })}
              disabled={guardar.isPending}
            >
              Guardar avance
            </Button>
            <Button
              variante="primary"
              disabled={cerrar.isPending || capturadas(lineas).length === 0}
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

      {!bloqueado && diferencias.length > 0 && (
        <Aviso>
          {diferencias.length} insumo{diferencias.length > 1 ? 's' : ''} con diferencia. Impacto en
          valor de inventario: <strong>{money(impacto)}</strong>. Al cerrar se generan los ajustes
          correspondientes.
        </Aviso>
      )}

      <Card className="overflow-hidden">
        <table className="w-full border-collapse text-sm" aria-label="Captura de conteo físico">
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
              const dif = diferencia(l)
              return (
                <tr key={l.insumoId} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-1.5">{insumo?.nombre ?? l.insumoId}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-zinc-500">
                    {cantidad(l.teorico, insumo?.unidad)}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      disabled={bloqueado}
                      value={l.fisico ?? ''}
                      onChange={(e) => setFisico(l.insumoId, e.target.value)}
                      aria-label={`Existencia física de ${insumo?.nombre ?? l.insumoId}`}
                      className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-right tabular-nums focus:border-zinc-900 focus:outline-none disabled:bg-zinc-100"
                    />
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right tabular-nums ${
                      dif && dif < 0 ? 'text-red-600' : dif ? 'text-emerald-700' : 'text-zinc-400'
                    }`}
                  >
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
