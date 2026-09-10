import { useCallback, useMemo, useState } from 'react'
import { Aviso, Badge, Button, Cargando, DataTable, Page, type Columna } from '@/shared/ui'
import { money, pct } from '@/shared/lib'
import type { Receta } from '@/shared/api/contracts'
import { useInsumosById } from '@/entities/insumo'
import { DESVIO_TOLERADO, costoReceta, desvioCosto, margen, useRecetas } from '@/entities/receta'
import { ModalEditarReceta, recetaVacia } from '@/features/editar-receta'

export default function RecetasPage() {
  const { data: recetas } = useRecetas()
  const insumos = useInsumosById()
  const [editando, setEditando] = useState<Receta | null>(null)

  const costo = useCallback((r: Receta) => costoReceta(r, insumos), [insumos])

  const columnas = useMemo<Array<Columna<Receta>>>(
    () => [
      { key: 'nombre', header: 'Cóctel', valor: (r) => r.nombre },
      {
        key: 'cristaleria',
        header: 'Cristalería',
        valor: (r) => r.cristaleria,
        className: 'text-zinc-600',
      },
      {
        key: 'metodo',
        header: 'Método',
        valor: (r) => r.metodo,
        render: (r) => <Badge>{r.metodo}</Badge>,
      },
      {
        key: 'ingredientes',
        header: 'Insumos',
        align: 'right',
        valor: (r) => r.ingredientes.length,
      },
      {
        key: 'costo',
        header: 'Costo calculado',
        align: 'right',
        valor: (r) => costo(r),
        render: (r) => <span className="font-medium tabular-nums">{money(costo(r))}</span>,
      },
      {
        key: 'costoDoc',
        header: 'Costo recetario',
        align: 'right',
        valor: (r) => r.costoDoc,
        render: (r) => {
          const desvio = desvioCosto(costo(r), r.costoDoc)
          return (
            <span className="flex items-center justify-end gap-2 tabular-nums text-zinc-500">
              {money(r.costoDoc)}
              {desvio > DESVIO_TOLERADO && <Badge tono="warn">{pct(desvio)}</Badge>}
            </span>
          )
        },
      },
      {
        key: 'precio',
        header: 'Precio',
        align: 'right',
        valor: (r) => r.precio,
        render: (r) => <span className="tabular-nums">{money(r.precio)}</span>,
      },
      {
        key: 'margen',
        header: 'Margen',
        align: 'right',
        valor: (r) => margen(r.precio, costo(r)),
        render: (r) => (
          <span className="tabular-nums text-emerald-700">{pct(margen(r.precio, costo(r)))}</span>
        ),
      },
    ],
    [costo],
  )

  if (!recetas || Object.keys(insumos).length === 0) return <Cargando />

  const desviadas = recetas.filter((r) => desvioCosto(costo(r), r.costoDoc) > DESVIO_TOLERADO)

  return (
    <Page
      titulo="Recetas"
      descripcion="Recetas tipo BOM. Una venta descuenta todos los ingredientes de la receta a la vez."
      acciones={
        <Button variante="primary" onClick={() => setEditando(recetaVacia())}>
          Nueva receta
        </Button>
      }
    >
      <Aviso>
        Hay dos versiones del recetario que no coinciden. Aquí está cargada la de{' '}
        <code className="font-mono text-xs">docs/productos</code>: confirmar con el gerente cuál es
        la vigente antes de operar.
        {desviadas.length > 0 && (
          <>
            {' '}
            Además, {desviadas.length} receta{desviadas.length > 1 ? 's' : ''} difiere
            {desviadas.length > 1 ? 'n' : ''} más de {pct(DESVIO_TOLERADO)} entre el costo calculado
            y el que declara el recetario (garnituras sin dosificar).
          </>
        )}
      </Aviso>
      <DataTable
        datos={recetas}
        columnas={columnas}
        rowKey={(r) => r.id}
        onRowClick={setEditando}
        etiqueta="Recetario"
        vacio="Sin recetas"
      />
      {editando && <ModalEditarReceta receta={editando} onCerrar={() => setEditando(null)} />}
    </Page>
  )
}
