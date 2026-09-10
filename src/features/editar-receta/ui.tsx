import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Field, Input, Modal, Select } from '@/shared/ui'
import { money, pct } from '@/shared/lib'
import type { Receta, RecetaIngrediente } from '@/shared/api/contracts'
import { useInsumosById } from '@/entities/insumo'
import { METODOS, costoReceta, margen } from '@/entities/receta'
import { useGuardarReceta } from './api'

export const recetaVacia = (): Receta => ({
  id: '',
  nombre: '',
  cristaleria: '',
  metodo: 'Construido',
  garnitura: '',
  precio: 0,
  costoDoc: 0,
  ingredientes: [],
})

export function ModalEditarReceta({ receta, onCerrar }: { receta: Receta; onCerrar: () => void }) {
  const insumos = useInsumosById()
  const guardar = useGuardarReceta()
  const lista = Object.values(insumos)

  const [datos, setDatos] = useState(receta)
  const set = <K extends keyof Receta>(k: K, v: Receta[K]) => setDatos((d) => ({ ...d, [k]: v }))

  const setIngrediente = (i: number, patch: Partial<RecetaIngrediente>) =>
    setDatos((d) => ({
      ...d,
      ingredientes: d.ingredientes.map((ing, k) => (k === i ? { ...ing, ...patch } : ing)),
    }))

  const costo = costoReceta(datos, insumos)

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={receta.id ? receta.nombre : 'Nueva receta'}
      ancho="max-w-3xl"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre">
            <Input value={datos.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </Field>
          <Field label="Cristalería">
            <Input value={datos.cristaleria} onChange={(e) => set('cristaleria', e.target.value)} />
          </Field>
          <Field label="Método">
            <Select value={datos.metodo} onChange={(e) => set('metodo', e.target.value)}>
              {METODOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Garnitura">
            <Input value={datos.garnitura} onChange={(e) => set('garnitura', e.target.value)} />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Ingredientes (BOM)</h3>
            <Button
              className="px-2 py-1 text-xs"
              onClick={() =>
                set('ingredientes', [
                  ...datos.ingredientes,
                  { insumoId: lista[0]?.id ?? '', cantidad: 0 },
                ])
              }
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
                    {lista.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nombre}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={ing.cantidad}
                    aria-label="Cantidad"
                    onChange={(e) => setIngrediente(i, { cantidad: Number(e.target.value) })}
                    className="w-24 text-right"
                  />
                  <span className="w-14 text-xs text-zinc-500">{insumo?.unidad}</span>
                  <span className="w-20 text-right text-xs tabular-nums text-zinc-500">
                    {money(ing.cantidad * (insumo?.costoUnitario ?? 0))}
                  </span>
                  <label className="flex w-24 items-center gap-1 text-xs text-zinc-500">
                    <input
                      type="checkbox"
                      className="size-3.5"
                      checked={!!ing.garnitura}
                      onChange={(e) => setIngrediente(i, { garnitura: e.target.checked })}
                    />
                    garnitura
                  </label>
                  <Button
                    variante="ghost"
                    className="px-1.5"
                    aria-label="Quitar ingrediente"
                    onClick={() =>
                      set(
                        'ingredientes',
                        datos.ingredientes.filter((_, k) => k !== i),
                      )
                    }
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
            <Input
              type="number"
              step="0.01"
              value={datos.precio}
              onChange={(e) => set('precio', Number(e.target.value))}
            />
          </Field>
          <Dato label="Costo calculado" valor={money(costo)} />
          <Dato label="Costo recetario" valor={money(datos.costoDoc)} />
          <Dato label="Margen" valor={pct(margen(datos.precio, costo))} />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button
            variante="primary"
            disabled={guardar.isPending || !datos.nombre}
            onClick={async () => {
              await guardar.mutateAsync(datos)
              onCerrar()
            }}
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
