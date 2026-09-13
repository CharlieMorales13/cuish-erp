import { useMemo, useState } from 'react'
import { Badge, Button, Cargando, DataTable, Page, type Columna } from '@/shared/ui'
import { cantidad, diasParaCaducar, fecha } from '@/shared/lib'
import type { Lote } from '@/shared/api/contracts'
import { EstadoLoteBadge, useLotes } from '@/entities/lote'
import { useInsumosById } from '@/entities/insumo'
import { BotonAbrirBotella } from '@/features/abrir-botella'
import { ModalRecibirMercancia } from '@/features/recibir-mercancia'

export default function LotesPage() {
  const { data: lotes } = useLotes()
  const insumos = useInsumosById()
  const [alta, setAlta] = useState(false)

  const columnas = useMemo<Array<Columna<Lote>>>(
    () => [
      {
        key: 'id',
        header: 'Lote',
        valor: (l) => l.id,
        className: 'font-mono text-xs text-zinc-500',
      },
      { key: 'insumo', header: 'Insumo', valor: (l) => insumos[l.insumoId]?.nombre ?? l.insumoId },
      {
        key: 'estado',
        header: 'Estado',
        valor: (l) => l.estado,
        render: (l) => <EstadoLoteBadge estado={l.estado} />,
      },
      {
        key: 'restante',
        header: 'Restante',
        align: 'right',
        valor: (l) => l.restante,
        render: (l) => (
          <span
            className={l.restante < 0 ? 'font-medium tabular-nums text-red-600' : 'tabular-nums'}
          >
            {cantidad(l.restante, insumos[l.insumoId]?.unidad)}
          </span>
        ),
      },
      {
        key: 'consumido',
        header: 'Consumido',
        align: 'right',
        valor: (l) => l.inicial - l.restante,
        render: (l) => (
          <span className="tabular-nums text-zinc-500">{cantidad(l.inicial - l.restante)}</span>
        ),
      },
      {
        key: 'marbete',
        header: 'Marbete',
        valor: (l) => l.marbete ?? '',
        render: (l) => <span className="font-mono text-xs">{l.marbete ?? '—'}</span>,
      },
      {
        key: 'caducidad',
        header: 'Caducidad',
        valor: (l) => l.caducidad ?? '9999',
        render: (l) => {
          if (!l.caducidad) return <span className="text-zinc-300">no aplica</span>
          const dias = diasParaCaducar(l.caducidad)!
          return (
            <span className="flex items-center gap-2">
              {fecha(l.caducidad)}
              {dias <= 15 && (
                <Badge tono={dias < 0 ? 'danger' : 'warn'}>
                  {dias < 0 ? 'caducado' : `${dias} d`}
                </Badge>
              )}
            </span>
          )
        },
      },
      {
        key: 'recibido',
        header: 'Recibido',
        valor: (l) => l.recibido,
        render: (l) => fecha(l.recibido),
      },
      {
        key: 'accion',
        header: '',
        render: (l) => (l.estado === 'cerrada' ? <BotonAbrirBotella loteId={l.id} /> : null),
      },
    ],
    [insumos],
  )

  if (!lotes) return <Cargando />

  return (
    <Page
      titulo="Lotes y marbetes"
      descripcion="Cada botella es una partida. El copeo consume solo de botellas abiertas, la más vieja primero."
      acciones={
        <Button variante="primary" onClick={() => setAlta(true)}>
          Recibir mercancía
        </Button>
      }
    >
      <DataTable
        datos={lotes}
        columnas={columnas}
        rowKey={(l) => l.id}
        etiqueta="Lotes de inventario"
        vacio="Sin lotes"
      />
      <ModalRecibirMercancia abierto={alta} onCerrar={() => setAlta(false)} />
    </Page>
  )
}
