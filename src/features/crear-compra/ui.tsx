import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Aviso, Button, Field, Input, Modal, Select } from '@/shared/ui'
import { money } from '@/shared/lib'
import type { LineaCompra } from '@/shared/api/contracts'
import { useInsumosById } from '@/entities/insumo'
import { useProveedores } from '@/entities/proveedor'
import { totalCompra } from '@/entities/compra'
import { useCrearCompra } from './api'

export function ModalCrearCompra({
  abierto,
  onCerrar,
}: {
  abierto: boolean
  onCerrar: () => void
}) {
  const { data: proveedores } = useProveedores()
  const insumos = useInsumosById()
  const crear = useCrearCompra()
  const lista = Object.values(insumos)

  const [proveedorId, setProveedorId] = useState('')
  const [cascos, setCascos] = useState(0)
  const [lineas, setLineas] = useState<LineaCompra[]>([])

  const setLinea = (i: number, patch: Partial<LineaCompra>) =>
    setLineas((prev) => prev.map((l, k) => (k === i ? { ...l, ...patch } : l)))

  const agregar = () => {
    const insumo = lista[0]
    if (insumo)
      setLineas((p) => [
        ...p,
        { insumoId: insumo.id, presentaciones: 1, costoCompra: insumo.costoCompra },
      ])
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nueva requisición de compra"
      ancho="max-w-2xl"
    >
      <div className="flex flex-col gap-3">
        <Aviso tono="info">
          Falta definir quién autoriza una requisición y si hay tope de monto. Por ahora cualquier
          usuario la crea y la recibe.
        </Aviso>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Proveedor">
            <Select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">Selecciona…</option>
              {proveedores?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Envases prestados"
            hint="Cascos que entrega el proveedor y hay que devolver"
          >
            <Input
              type="number"
              min={0}
              value={cascos}
              onChange={(e) => setCascos(Number(e.target.value))}
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Partidas</h3>
            <Button className="px-2 py-1 text-xs" onClick={agregar}>
              Agregar partida
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {lineas.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={l.insumoId}
                  aria-label="Insumo"
                  onChange={(e) =>
                    setLinea(i, {
                      insumoId: e.target.value,
                      costoCompra: insumos[e.target.value].costoCompra,
                    })
                  }
                  className="flex-1"
                >
                  {lista.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nombre}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={l.presentaciones}
                  aria-label="Presentaciones"
                  onChange={(e) => setLinea(i, { presentaciones: Number(e.target.value) })}
                  className="w-20 text-right"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={l.costoCompra}
                  aria-label="Costo de compra"
                  onChange={(e) => setLinea(i, { costoCompra: Number(e.target.value) })}
                  className="w-28 text-right"
                />
                <span className="w-24 text-right text-sm tabular-nums text-zinc-600">
                  {money(l.presentaciones * l.costoCompra)}
                </span>
                <Button
                  variante="ghost"
                  className="px-1.5"
                  aria-label="Quitar partida"
                  onClick={() => setLineas((p) => p.filter((_, k) => k !== i))}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            {lineas.length === 0 && (
              <p className="rounded-md border border-dashed border-zinc-300 py-6 text-center text-sm text-zinc-500">
                Sin partidas.
              </p>
            )}
          </div>
        </div>

        <p className="text-right text-sm text-zinc-600">
          Total:{' '}
          <strong className="tabular-nums text-zinc-900">{money(totalCompra(lineas))}</strong>
        </p>

        <div className="flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button
            variante="primary"
            disabled={!proveedorId || lineas.length === 0 || crear.isPending}
            onClick={async () => {
              await crear.mutateAsync({ proveedorId, lineas, cascosPrestados: cascos })
              setLineas([])
              setProveedorId('')
              setCascos(0)
              onCerrar()
            }}
          >
            Crear requisición
          </Button>
        </div>
      </div>
    </Modal>
  )
}
