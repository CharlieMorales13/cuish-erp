import { useMemo } from 'react'
import { Aviso, Badge, Cargando, DataTable, Page, type Columna, type Tono } from '@/shared/ui'
import { cantidad, money } from '@/shared/lib'
import type { Insumo } from '@/shared/api/contracts'
import {
  estadoExistencia,
  useInsumos,
  valorInventario,
  type EstadoExistencia,
} from '@/entities/insumo'
import { useExistencias } from '@/entities/lote'

const TONO: Record<EstadoExistencia, Tono> = {
  Agotado: 'danger',
  'Bajo mínimo': 'warn',
  'Sobre máximo': 'info',
  'En rango': 'ok',
}

export default function InventarioPage() {
  const { data: insumos } = useInsumos()
  const { data: existencias } = useExistencias()

  const columnas = useMemo<Array<Columna<Insumo>>>(() => {
    if (!existencias) return []
    const ex = (i: Insumo) => existencias[i.id] ?? { cerrado: 0, abierto: 0, total: 0 }
    return [
      { key: 'id', header: 'ID', valor: (i) => i.id, className: 'font-mono text-xs text-zinc-500' },
      { key: 'nombre', header: 'Insumo', valor: (i) => i.nombre },
      {
        key: 'categoria',
        header: 'Categoría',
        valor: (i) => i.categoria,
        render: (i) => <Badge>{i.categoria}</Badge>,
      },
      {
        key: 'cerrado',
        header: 'Cerrado',
        align: 'right',
        valor: (i) => ex(i).cerrado,
        render: (i) =>
          i.esBotella ? (
            <span className="tabular-nums">{cantidad(ex(i).cerrado, i.unidad)}</span>
          ) : (
            <span className="text-zinc-300">—</span>
          ),
      },
      {
        key: 'abierto',
        header: 'Abierto / copeo',
        align: 'right',
        valor: (i) => ex(i).abierto,
        render: (i) => <span className="tabular-nums">{cantidad(ex(i).abierto, i.unidad)}</span>,
      },
      {
        key: 'total',
        header: 'Total',
        align: 'right',
        valor: (i) => ex(i).total,
        render: (i) => (
          <span className="font-medium tabular-nums">{cantidad(ex(i).total, i.unidad)}</span>
        ),
      },
      {
        key: 'min',
        header: 'Mín / Máx',
        align: 'right',
        valor: (i) => i.min,
        render: (i) => (
          <span className="tabular-nums text-zinc-500">
            {cantidad(i.min)} / {cantidad(i.max)}
          </span>
        ),
      },
      {
        key: 'valor',
        header: 'Valor',
        align: 'right',
        valor: (i) => ex(i).total * i.costoUnitario,
        render: (i) => <span className="tabular-nums">{money(ex(i).total * i.costoUnitario)}</span>,
      },
      {
        key: 'estado',
        header: 'Estado',
        valor: (i) => estadoExistencia(ex(i).total, i),
        render: (i) => {
          const estado = estadoExistencia(ex(i).total, i)
          return <Badge tono={TONO[estado]}>{estado}</Badge>
        },
      },
    ]
  }, [existencias])

  if (!insumos || !existencias) return <Cargando />

  const bajos = insumos.filter((i) => existencias[i.id].total < i.min).length

  return (
    <Page
      titulo="Inventario"
      descripcion="Almacén único. La botella cerrada y la botella de copeo se cuentan por separado."
    >
      {bajos > 0 && (
        <Aviso>
          {bajos} insumo{bajos > 1 ? 's' : ''} por debajo de la existencia mínima. Las existencias
          mínimas y máximas son valores provisionales: falta confirmarlas con el gerente.
        </Aviso>
      )}
      <DataTable
        datos={insumos}
        columnas={columnas}
        rowKey={(i) => i.id}
        etiqueta="Existencias por insumo"
        vacio="Sin insumos en el catálogo"
      />
      <p className="text-right text-sm text-zinc-600">
        Valor total del inventario:{' '}
        <strong className="tabular-nums text-zinc-900">
          {money(valorInventario(insumos, existencias))}
        </strong>
      </p>
    </Page>
  )
}
