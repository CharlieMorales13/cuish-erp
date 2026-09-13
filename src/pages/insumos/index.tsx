import { useMemo, useState } from 'react'
import { Badge, Button, Cargando, DataTable, Page, type Columna } from '@/shared/ui'
import { cantidad, money, moneyFino } from '@/shared/lib'
import type { Insumo } from '@/shared/api/contracts'
import { rendimiento, useInsumos } from '@/entities/insumo'
import { TRAGO_OZ, TRAGO_ML } from '@/shared/model/unidades'
import { ModalEditarInsumo, insumoVacio } from '@/features/editar-insumo'

/** El rendimiento por trago solo tiene sentido en lo que se sirve derecho. */
const esDestiladoEnMl = (i: Insumo) => i.esBotella && i.unidad === 'ml'

export default function InsumosPage() {
  const { data: insumos } = useInsumos()
  const [editando, setEditando] = useState<Insumo | null>(null)

  const columnas = useMemo<Array<Columna<Insumo>>>(
    () => [
      { key: 'id', header: 'ID', valor: (i) => i.id, className: 'font-mono text-xs text-zinc-500' },
      { key: 'nombre', header: 'Insumo', valor: (i) => i.nombre },
      {
        key: 'categoria',
        header: 'Categoría',
        valor: (i) => i.categoria,
        render: (i) => <Badge>{i.categoria}</Badge>,
      },
      {
        key: 'presentacion',
        header: 'Presentación de compra',
        align: 'right',
        valor: (i) => i.presentacion,
        render: (i) => <span className="tabular-nums">{cantidad(i.presentacion, i.unidad)}</span>,
      },
      {
        key: 'costoCompra',
        header: 'Costo compra',
        align: 'right',
        valor: (i) => i.costoCompra,
        render: (i) => <span className="tabular-nums">{money(i.costoCompra)}</span>,
      },
      {
        key: 'costoUnitario',
        header: 'Costo unitario',
        align: 'right',
        valor: (i) => i.costoUnitario,
        render: (i) => (
          <span className="tabular-nums">
            {moneyFino(i.costoUnitario)} <span className="text-zinc-400">/ {i.unidad}</span>
          </span>
        ),
      },
      {
        key: 'rinde',
        header: 'Rinde',
        align: 'right',
        valor: (i) => (esDestiladoEnMl(i) ? rendimiento(i.presentacion, TRAGO_ML) : 0),
        render: (i) =>
          esDestiladoEnMl(i) ? (
            <span className="tabular-nums">
              {rendimiento(i.presentacion, TRAGO_ML).toFixed(1)}{' '}
              <span className="text-zinc-400">tragos de {TRAGO_OZ} oz</span>
            </span>
          ) : (
            <span className="text-zinc-300">—</span>
          ),
      },
      {
        key: 'caja',
        header: 'Por caja',
        align: 'right',
        valor: (i) => i.piezasPorCaja ?? 0,
        render: (i) =>
          i.piezasPorCaja ? (
            <span className="tabular-nums">{i.piezasPorCaja}</span>
          ) : (
            <span className="text-zinc-300">—</span>
          ),
      },
      {
        key: 'flags',
        header: 'Control',
        render: (i) => (
          <span className="flex gap-1">
            {i.esBotella && <Badge tono="info">copeo</Badge>}
            {i.caduca && <Badge tono="warn">caduca</Badge>}
          </span>
        ),
      },
    ],
    [],
  )

  if (!insumos) return <Cargando />

  return (
    <Page
      titulo="Insumos"
      descripcion="Catálogo y costeo. El costo unitario se calcula desde la presentación de compra."
      acciones={
        <Button variante="primary" onClick={() => setEditando(insumoVacio())}>
          Nuevo insumo
        </Button>
      }
    >
      <DataTable
        datos={insumos}
        columnas={columnas}
        rowKey={(i) => i.id}
        onRowClick={setEditando}
        etiqueta="Catálogo de insumos"
        vacio="Sin insumos"
      />
      {editando && <ModalEditarInsumo insumo={editando} onCerrar={() => setEditando(null)} />}
    </Page>
  )
}
