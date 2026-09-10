import { useMemo, useState } from 'react'
import { Badge, Button, Cargando, DataTable, Page, type Columna } from '@/shared/ui'
import { cantidad, fechaConHora } from '@/shared/lib'
import type { Movimiento } from '@/shared/api/contracts'
import { TONO_MOVIMIENTO, useMovimientos } from '@/entities/movimiento'
import { useInsumosById } from '@/entities/insumo'
import { ModalRegistrarMovimiento } from '@/features/registrar-movimiento'

export default function MovimientosPage() {
  const { data: movimientos } = useMovimientos()
  const insumos = useInsumosById()
  const [manual, setManual] = useState(false)

  const columnas = useMemo<Array<Columna<Movimiento>>>(
    () => [
      {
        key: 'fecha',
        header: 'Fecha',
        valor: (m) => m.fecha,
        render: (m) => (
          <span className="whitespace-nowrap text-zinc-600">{fechaConHora(m.fecha)}</span>
        ),
      },
      {
        key: 'tipo',
        header: 'Tipo',
        valor: (m) => m.tipo,
        render: (m) => <Badge tono={TONO_MOVIMIENTO[m.tipo]}>{m.tipo}</Badge>,
      },
      { key: 'insumo', header: 'Insumo', valor: (m) => insumos[m.insumoId]?.nombre ?? m.insumoId },
      {
        key: 'lote',
        header: 'Lote',
        valor: (m) => m.loteId ?? '',
        render: (m) => <span className="font-mono text-xs text-zinc-500">{m.loteId ?? '—'}</span>,
      },
      {
        key: 'cantidad',
        header: 'Cantidad',
        align: 'right',
        valor: (m) => m.cantidad,
        render: (m) => (
          <span
            className={
              m.cantidad < 0
                ? 'tabular-nums text-red-600'
                : m.cantidad > 0
                  ? 'tabular-nums text-emerald-700'
                  : 'tabular-nums text-zinc-400'
            }
          >
            {m.cantidad > 0 ? '+' : ''}
            {cantidad(m.cantidad, insumos[m.insumoId]?.unidad)}
          </span>
        ),
      },
      { key: 'motivo', header: 'Motivo', valor: (m) => m.motivo ?? '', className: 'text-zinc-600' },
      {
        key: 'ref',
        header: 'Referencia',
        valor: (m) => m.ref ?? '',
        className: 'font-mono text-xs text-zinc-500',
      },
      { key: 'usuario', header: 'Usuario', valor: (m) => m.usuario, className: 'text-zinc-500' },
    ],
    [insumos],
  )

  if (!movimientos) return <Cargando />

  return (
    <Page
      titulo="Movimientos"
      descripcion="Kardex del almacén: entradas, salidas, ajustes, mermas, aperturas y consumo por venta."
      acciones={
        <Button variante="primary" onClick={() => setManual(true)}>
          Registrar movimiento
        </Button>
      }
    >
      <DataTable
        datos={movimientos}
        columnas={columnas}
        rowKey={(m) => m.id}
        etiqueta="Kardex de movimientos"
        vacio="Sin movimientos"
      />
      <ModalRegistrarMovimiento abierto={manual} onCerrar={() => setManual(false)} />
    </Page>
  )
}
