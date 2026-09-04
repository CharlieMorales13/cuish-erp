import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Aviso, Badge, Button, Cargando, DataTable, Field, Input, Modal, Page, Select, type Columna } from '../ui'
import { money, pct } from '../lib'
import { costoReceta } from '../domain/inventario'
import type { Receta, RecetaIngrediente } from '../domain/types'
import { useGuardarReceta, useInsumosById, useRecetas } from '../hooks'

export default function Recetas() {
  const { data: recetas } = useRecetas()
  const insumos = useInsumosById()
  const [editando, setEditando] = useState<Receta | null>(null)

  const costo = (r: Receta) => costoReceta(r, insumos)

  const columnas = useMemo<Array<Columna<Receta>>>(() => [
    { key: 'nombre', header: 'Cóctel', valor: (r) => r.nombre },
    { key: 'cristaleria', header: 'Cristalería', valor: (r) => r.cristaleria, className: 'text-zinc-600' },
    { key: 'metodo', header: 'Método', valor: (r) => r.metodo, render: (r) => <Badge>{r.metodo}</Badge> },
    { key: 'ingredientes', header: 'Insumos', align: 'right', valor: (r) => r.ingredientes.length },
    {
      key: 'costo', header: 'Costo calculado', align: 'right', valor: (r) => costo(r),
      render: (r) => <span className="tabular-nums font-medium">{money(costo(r))}</span>,
    },
    {
      key: 'costoDoc', header: 'Costo recetario', align: 'right', valor: (r) => r.costoDoc,
      render: (r) => {
        const desvio = Math.abs(costo(r) - r.costoDoc) / r.costoDoc
        return (
          <span className="flex items-center justify-end gap-2 tabular-nums text-zinc-500">
            {money(r.costoDoc)}
            {desvio > 0.05 && <Badge tono="warn">{pct(desvio)}</Badge>}
          </span>
        )
      },
    },
    { key: 'precio', header: 'Precio', align: 'right', valor: (r) => r.precio, render: (r) => <span className="tabular-nums">{money(r.precio)}</span> },
    {
      key: 'margen', header: 'Margen', align: 'right', valor: (r) => (r.precio - costo(r)) / r.precio,
      render: (r) => <span className="tabular-nums text-emerald-700">{pct((r.precio - costo(r)) / r.precio)}</span>,
    },
  ], [insumos])

  if (!recetas || Object.keys(insumos).length === 0) return <Cargando />

  const desviadas = recetas.filter((r) => Math.abs(costo(r) - r.costoDoc) / r.costoDoc > 0.05)

  return (
    <Page
      titulo="Recetas"
      descripcion="Recetas tipo BOM. Una venta descuenta todos los ingredientes de la receta a la vez."
      acciones={<Button variante="primary" onClick={() => setEditando(nueva())}>Nueva receta</Button>}
    >
      <Aviso>
        Hay dos versiones del recetario que no coinciden. Aquí está cargada la de{' '}
        <code className="font-mono text-xs">docs/productos</code>: confirmar con el gerente cuál es la vigente
        antes de operar.
        {desviadas.length > 0 && <> Además, {desviadas.length} receta{desviadas.length > 1 ? 's' : ''} difiere{desviadas.length > 1 ? 'n' : ''} más de 5% entre el costo calculado y el que declara el recetario (garnituras sin dosificar).</>}
      </Aviso>
      <DataTable datos={recetas} columnas={columnas} rowKey={(r) => r.id} onRowClick={setEditando} vacio="Sin recetas" />
      {editando && <ModalReceta receta={editando} onCerrar={() => setEditando(null)} />}
    </Page>
  )
}

const nueva = (): Receta => ({
  id: '', nombre: '', cristaleria: '', metodo: 'Construido', garnitura: '',
  precio: 0, costoDoc: 0, ingredientes: [],
})

function ModalReceta({ receta, onCerrar }: { receta: Receta; onCerrar: () => void }) {
  const insumos = useInsumosById()
  const guardar = useGuardarReceta()
  const lista = Object.values(insumos)

  const [datos, setDatos] = useState(receta)
  const set = <K extends keyof Receta>(k: K, v: Receta[K]) => setDatos((d) => ({ ...d, [k]: v }))

  const setIngrediente = (i: number, patch: Partial<RecetaIngrediente>) =>
    setDatos((d) => ({ ...d, ingredientes: d.ingredientes.map((ing, k) => k === i ? { ...ing, ...patch } : ing) }))

  const costo = costoReceta(datos, insumos)
  const margen = datos.precio > 0 ? (datos.precio - costo) / datos.precio : 0

  return (
    <Modal abierto onCerrar={onCerrar} titulo={receta.id ? receta.nombre : 'Nueva receta'} ancho="max-w-3xl">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre"><Input value={datos.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
          <Field label="Cristalería"><Input value={datos.cristaleria} onChange={(e) => set('cristaleria', e.target.value)} /></Field>
          <Field label="Método">
            <Select value={datos.metodo} onChange={(e) => set('metodo', e.target.value)}>
              {['Construido', 'Refrescado', 'Shakeado', 'Macerado', 'Roll', 'Construido / Shakeado'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="Garnitura"><Input value={datos.garnitura} onChange={(e) => set('garnitura', e.target.value)} /></Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Ingredientes (BOM)</h3>
            <Button
              className="px-2 py-1 text-xs"
              onClick={() => set('ingredientes', [...datos.ingredientes, { insumoId: lista[0]?.id ?? '', cantidad: 0 }])}
            >
              Agregar ingrediente
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {datos.ingredientes.map((ing, i) => {
              const insumo = insumos[ing.insumoId]
              return (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={ing.insumoId}
                    onChange={(e) => setIngrediente(i, { insumoId: e.target.value })}
                    className="flex-1"
                    aria-label="Insumo"
                  >
                    {lista.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                  </Select>
                  <Input
                    type="number" step="0.01" value={ing.cantidad} aria-label="Cantidad"
                    onChange={(e) => setIngrediente(i, { cantidad: Number(e.target.value) })}
                    className="w-24 text-right"
                  />
                  <span className="w-14 text-xs text-zinc-500">{insumo?.unidad}</span>
                  <span className="w-20 text-right text-xs tabular-nums text-zinc-500">
                    {money(ing.cantidad * (insumo?.costoUnitario ?? 0))}
                  </span>
                  <label className="flex w-24 items-center gap-1 text-xs text-zinc-500">
                    <input
                      type="checkbox" className="size-3.5" checked={!!ing.garnitura}
                      onChange={(e) => setIngrediente(i, { garnitura: e.target.checked })}
                    />
                    garnitura
                  </label>
                  <Button
                    variante="ghost" className="px-1.5" aria-label="Quitar ingrediente"
                    onClick={() => set('ingredientes', datos.ingredientes.filter((_, k) => k !== i))}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )
            })}
            {datos.ingredientes.length === 0 && (
              <p className="rounded-md border border-dashed border-zinc-300 py-6 text-center text-sm text-zinc-500">
                Sin ingredientes. Una receta sin BOM no descuenta inventario.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 rounded-md bg-zinc-50 px-3 py-3 text-sm">
          <Field label="Precio de venta">
            <Input type="number" step="0.01" value={datos.precio} onChange={(e) => set('precio', Number(e.target.value))} />
          </Field>
          <Dato label="Costo calculado" valor={money(costo)} />
          <Dato label="Costo recetario" valor={money(datos.costoDoc)} />
          <Dato label="Margen" valor={pct(margen)} />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button
            variante="primary"
            disabled={guardar.isPending || !datos.nombre}
            onClick={async () => { await guardar.mutateAsync(datos); onCerrar() }}
          >
            Guardar receta
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      <span className="px-0.5 py-1.5 font-medium tabular-nums text-zinc-900">{valor}</span>
    </div>
  )
}

