import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Aviso, Badge, Button, Card, Cargando, Field, Input, Modal, Page, Select } from '../ui'
import { cantidad, fecha, money } from '../lib'
import type { Compra, LineaCompra } from '../domain/types'
import {
  useCompras, useCrearCompra, useDevolverCascos, useInsumosById, useProveedores, useRecibirCompra,
} from '../hooks'

export default function Compras() {
  const { data: compras } = useCompras()
  const { data: proveedores } = useProveedores()
  const insumos = useInsumosById()
  const recibir = useRecibirCompra()
  const devolver = useDevolverCascos()
  const [alta, setAlta] = useState(false)

  if (!compras || !proveedores) return <Cargando />

  const totalDe = (c: Compra) => c.lineas.reduce((s, l) => s + l.presentaciones * l.costoCompra, 0)
  const cascosVivos = compras.reduce((s, c) => s + (c.estado === 'recibida' ? c.cascosPrestados - c.cascosDevueltos : 0), 0)

  return (
    <Page
      titulo="Compras"
      descripcion="Requisición, recepción de mercancía y control de envases prestados."
      acciones={<Button variante="primary" onClick={() => setAlta(true)}>Nueva requisición</Button>}
    >
      {cascosVivos > 0 && (
        <Aviso>
          Hay <strong>{cascosVivos} envases</strong> prestados sin devolver. Falta definir con el cliente
          si el préstamo se controla por proveedor o por compra, y si tiene costo asociado.
        </Aviso>
      )}

      <div className="flex flex-col gap-3">
        {compras.map((c) => {
          const proveedor = proveedores.find((p) => p.id === c.proveedorId)
          const pendientes = c.cascosPrestados - c.cascosDevueltos
          return (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-zinc-900">{c.folio}</span>
                    <Badge tono={c.estado === 'recibida' ? 'ok' : 'warn'}>{c.estado}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-600">{proveedor?.nombre ?? c.proveedorId} · {fecha(c.fecha)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-sm font-medium text-zinc-900">{money(totalDe(c))}</span>
                  {c.estado === 'requisicion' && (
                    <Button variante="primary" disabled={recibir.isPending} onClick={() => recibir.mutate(c.id)}>
                      Recibir mercancía
                    </Button>
                  )}
                  {pendientes > 0 && (
                    <Button disabled={devolver.isPending} onClick={() => devolver.mutate({ compraId: c.id, cantidad: pendientes })}>
                      Devolver {pendientes} cascos
                    </Button>
                  )}
                </div>
              </div>

              <table className="mt-3 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y border-zinc-200 text-zinc-500">
                    <th className="py-1.5 text-left font-medium">Insumo</th>
                    <th className="py-1.5 text-right font-medium">Presentaciones</th>
                    <th className="py-1.5 text-right font-medium">Costo unitario</th>
                    <th className="py-1.5 text-right font-medium">Entra al almacén</th>
                    <th className="py-1.5 text-right font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {c.lineas.map((l, i) => {
                    const insumo = insumos[l.insumoId]
                    return (
                      <tr key={i} className="border-b border-zinc-100 last:border-0">
                        <td className="py-1.5 text-zinc-800">{insumo?.nombre ?? l.insumoId}</td>
                        <td className="py-1.5 text-right tabular-nums">{l.presentaciones}</td>
                        <td className="py-1.5 text-right tabular-nums text-zinc-500">{money(l.costoCompra)}</td>
                        <td className="py-1.5 text-right tabular-nums text-zinc-500">
                          {insumo ? cantidad(l.presentaciones * insumo.presentacion, insumo.unidad) : '—'}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">{money(l.presentaciones * l.costoCompra)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {c.cascosPrestados > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  Envases: {c.cascosPrestados} prestados, {c.cascosDevueltos} devueltos.
                </p>
              )}
            </Card>
          )
        })}
        {compras.length === 0 && <p className="py-16 text-center text-sm text-zinc-500">Sin compras registradas.</p>}
      </div>

      <ModalCompra abierto={alta} onCerrar={() => setAlta(false)} />
    </Page>
  )
}

function ModalCompra({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { data: proveedores } = useProveedores()
  const insumos = useInsumosById()
  const crear = useCrearCompra()
  const lista = Object.values(insumos)

  const [proveedorId, setProveedorId] = useState('')
  const [cascos, setCascos] = useState(0)
  const [lineas, setLineas] = useState<LineaCompra[]>([])

  const setLinea = (i: number, patch: Partial<LineaCompra>) =>
    setLineas((prev) => prev.map((l, k) => k === i ? { ...l, ...patch } : l))

  const total = lineas.reduce((s, l) => s + l.presentaciones * l.costoCompra, 0)

  const agregar = () => {
    const insumo = lista[0]
    if (insumo) setLineas((p) => [...p, { insumoId: insumo.id, presentaciones: 1, costoCompra: insumo.costoCompra }])
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Nueva requisición de compra" ancho="max-w-2xl">
      <div className="flex flex-col gap-3">
        <Aviso tono="info">
          Falta definir quién autoriza una requisición y si hay tope de monto. Por ahora cualquier
          usuario la crea y la recibe.
        </Aviso>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Proveedor">
            <Select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">Selecciona…</option>
              {proveedores?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Envases prestados" hint="Cascos que entrega el proveedor y hay que devolver">
            <Input type="number" min={0} value={cascos} onChange={(e) => setCascos(Number(e.target.value))} />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Partidas</h3>
            <Button className="px-2 py-1 text-xs" onClick={agregar}>Agregar partida</Button>
          </div>
          <div className="flex flex-col gap-2">
            {lineas.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={l.insumoId}
                  aria-label="Insumo"
                  onChange={(e) => setLinea(i, { insumoId: e.target.value, costoCompra: insumos[e.target.value].costoCompra })}
                  className="flex-1"
                >
                  {lista.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                </Select>
                <Input
                  type="number" min={1} value={l.presentaciones} aria-label="Presentaciones"
                  onChange={(e) => setLinea(i, { presentaciones: Number(e.target.value) })}
                  className="w-20 text-right"
                />
                <Input
                  type="number" step="0.01" value={l.costoCompra} aria-label="Costo de compra"
                  onChange={(e) => setLinea(i, { costoCompra: Number(e.target.value) })}
                  className="w-28 text-right"
                />
                <span className="w-24 text-right text-sm tabular-nums text-zinc-600">
                  {money(l.presentaciones * l.costoCompra)}
                </span>
                <Button variante="ghost" className="px-1.5" aria-label="Quitar partida" onClick={() => setLineas((p) => p.filter((_, k) => k !== i))}>
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

        <p className="text-right text-sm text-zinc-600">Total: <strong className="tabular-nums text-zinc-900">{money(total)}</strong></p>

        <div className="flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button
            variante="primary"
            disabled={!proveedorId || lineas.length === 0 || crear.isPending}
            onClick={async () => {
              await crear.mutateAsync({
                proveedorId, fecha: new Date().toISOString().slice(0, 10), lineas, cascosPrestados: cascos,
              })
              setLineas([]); setProveedorId(''); setCascos(0)
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
