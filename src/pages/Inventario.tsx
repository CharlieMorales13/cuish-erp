import { useMemo } from 'react'
import { Aviso, Badge, Cargando, DataTable, Page, type Columna } from '../ui'
import { cantidad, money } from '../lib'
import type { Insumo } from '../domain/types'
import { useExistencias, useInsumos } from '../hooks'

export default function Inventario() {
  const { data: insumos } = useInsumos()
  const { data: existencias } = useExistencias()

  const columnas = useMemo<Array<Columna<Insumo>>>(() => {
    if (!existencias) return []
    const ex = (i: Insumo) => existencias[i.id] ?? { cerrado: 0, abierto: 0, total: 0 }
    return [
      { key: 'id', header: 'ID', valor: (i) => i.id, className: 'font-mono text-xs text-zinc-500' },
      { key: 'nombre', header: 'Insumo', valor: (i) => i.nombre },
      { key: 'categoria', header: 'Categoría', valor: (i) => i.categoria, render: (i) => <Badge>{i.categoria}</Badge> },
      {
        key: 'cerrado', header: 'Cerrado', align: 'right', valor: (i) => ex(i).cerrado,
        render: (i) => (i.esBotella
          ? <span className="tabular-nums">{cantidad(ex(i).cerrado, i.unidad)}</span>
          : <span className="text-zinc-300">—</span>),
      },
      {
        key: 'abierto', header: 'Abierto / copeo', align: 'right', valor: (i) => ex(i).abierto,
        render: (i) => <span className="tabular-nums">{cantidad(ex(i).abierto, i.unidad)}</span>,
      },
      {
        key: 'total', header: 'Total', align: 'right', valor: (i) => ex(i).total,
        render: (i) => <span className="font-medium tabular-nums">{cantidad(ex(i).total, i.unidad)}</span>,
      },
      { key: 'min', header: 'Mín / Máx', align: 'right', valor: (i) => i.min, render: (i) => <span className="tabular-nums text-zinc-500">{cantidad(i.min)} / {cantidad(i.max)}</span> },
      {
        key: 'valor', header: 'Valor', align: 'right', valor: (i) => ex(i).total * i.costoUnitario,
        render: (i) => <span className="tabular-nums">{money(ex(i).total * i.costoUnitario)}</span>,
      },
      {
        key: 'estado', header: 'Estado', valor: (i) => estado(ex(i).total, i),
        render: (i) => {
          const e = estado(ex(i).total, i)
          return <Badge tono={e === 'Agotado' ? 'danger' : e === 'Bajo mínimo' ? 'warn' : e === 'Sobre máximo' ? 'info' : 'ok'}>{e}</Badge>
        },
      },
    ]
  }, [existencias])

  if (!insumos || !existencias) return <Cargando />

  const bajos = insumos.filter((i) => existencias[i.id].total < i.min).length
  const total = insumos.reduce((s, i) => s + existencias[i.id].total * i.costoUnitario, 0)

  return (
    <Page
      titulo="Inventario"
      descripcion="Almacén único. La botella cerrada y la botella de copeo se cuentan por separado."
    >
      {bajos > 0 && (
        <Aviso>
          {bajos} insumo{bajos > 1 ? 's' : ''} por debajo de la existencia mínima. Las existencias mínimas
          y máximas son valores provisionales: falta confirmarlas con el gerente.
        </Aviso>
      )}
      <DataTable
        datos={insumos}
        columnas={columnas}
        rowKey={(i) => i.id}
        vacio="Sin insumos en el catálogo"
      />
      <p className="text-right text-sm text-zinc-600">
        Valor total del inventario: <strong className="tabular-nums text-zinc-900">{money(total)}</strong>
      </p>
    </Page>
  )
}


function estado(total: number, insumo: Insumo) {
  if (total <= 0) return 'Agotado'
  if (total < insumo.min) return 'Bajo mínimo'
  if (total > insumo.max) return 'Sobre máximo'
  return 'En rango'
}
