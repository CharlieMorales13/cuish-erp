import { useState } from 'react'
import { Badge, Button, Card, EstadoConsulta, Page } from '@/shared/ui'
import { fechaConHora } from '@/shared/lib'
import { avance, useConteos } from '@/entities/conteo'
import { CapturaConteo, useCrearConteo } from '@/features/capturar-conteo'

export default function ConteoPage() {
  const consultaConteos = useConteos()
  const conteos = consultaConteos.data
  const crear = useCrearConteo()
  const [activoId, setActivoId] = useState<string | null>(null)

  if (!conteos) return <EstadoConsulta consultas={[consultaConteos]} />

  const activo = conteos.find((c) => c.id === activoId) ?? null

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
        <CapturaConteo key={activo.id} conteo={activo} onSalir={() => setActivoId(null)} />
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
                {avance(c)} capturados
                <Badge tono={c.estado === 'cerrado' ? 'ok' : 'warn'}>{c.estado}</Badge>
              </span>
            </button>
          ))}
          {conteos.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-zinc-500">Sin conteos registrados.</p>
          )}
        </Card>
      )}
    </Page>
  )
}
