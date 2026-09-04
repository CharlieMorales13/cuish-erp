import { useState } from 'react'
import { Aviso, Badge, Button, Card, Cargando, Modal, Page, Stat } from '../ui'
import { cantidad, fechaConHora, money } from '../lib'
import { explotarVenta, byId } from '../domain/inventario'
import type { Venta } from '../domain/types'
import { useAplicarVenta, useInsumosById, useRecetas, useVentas } from '../hooks'

export default function Ventas() {
  const { data: ventas } = useVentas()
  const { data: recetas } = useRecetas()
  const insumos = useInsumosById()
  const aplicar = useAplicarVenta()
  const [detalle, setDetalle] = useState<Venta | null>(null)
  const [faltantes, setFaltantes] = useState<Array<{ insumoId: string; cantidad: number }>>([])

  if (!ventas || !recetas) return <Cargando />

  const pendientes = ventas.filter((v) => !v.aplicada)
  const nombreDe = (id: string) => insumos[id]?.nombre ?? id

  const aplicarUna = async (venta: Venta) => {
    const r = await aplicar.mutateAsync(venta.id)
    setFaltantes(r.faltantes)
  }

  return (
    <Page
      titulo="Ventas del POS"
      descripcion="Solo lectura. El POS genera el UUID al capturar; aquí se descuenta el inventario al cerrar la cuenta."
      acciones={
        pendientes.length > 0 ? (
          <Button
            variante="primary"
            disabled={aplicar.isPending}
            onClick={async () => { for (const v of pendientes) await aplicarUna(v) }}
          >
            Aplicar {pendientes.length} pendientes
          </Button>
        ) : undefined
      }
    >
      {faltantes.length > 0 && (
        <Aviso tono="danger">
          Se cerró la cuenta con existencia insuficiente en:{' '}
          {faltantes.map((f) => `${nombreDe(f.insumoId)} (${cantidad(f.cantidad, insumos[f.insumoId]?.unidad)})`).join(', ')}.
          El inventario quedó en negativo. La alerta no bloquea el cierre, por diseño.
        </Aviso>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Tickets recibidos" valor={ventas.length} nota="del POS" />
        <Stat label="Sin aplicar" valor={pendientes.length} nota="no han descontado inventario" tono={pendientes.length ? 'danger' : undefined} />
        <Stat label="Venta total" valor={money(ventas.reduce((s, v) => s + v.total, 0))} />
      </div>

      <Card className="divide-y divide-zinc-100">
        {ventas.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <button onClick={() => setDetalle(v)} className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-zinc-900">{v.folio}</span>
                <Badge tono={v.aplicada ? 'ok' : 'warn'}>{v.aplicada ? 'inventario aplicado' : 'pendiente'}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">
                {v.cuenta} · {fechaConHora(v.fecha)} · {v.lineas.reduce((s, l) => s + l.cantidad, 0)} productos
              </p>
              <p className="font-mono text-[11px] text-zinc-400">uuid {v.id}</p>
            </button>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-sm font-medium text-zinc-900">{money(v.total)}</span>
              {!v.aplicada && (
                <Button variante="primary" disabled={aplicar.isPending} onClick={() => aplicarUna(v)}>
                  Aplicar al inventario
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>

      {detalle && (
        <Modal abierto onCerrar={() => setDetalle(null)} titulo={`Ticket ${detalle.folio}`} ancho="max-w-xl">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600">{detalle.cuenta} · {fechaConHora(detalle.fecha)}</p>

            <div>
              <h3 className="mb-1 text-sm font-semibold text-zinc-900">Productos vendidos</h3>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {detalle.lineas.map((l, i) => (
                    <tr key={i} className="border-b border-zinc-100 last:border-0">
                      <td className="py-1.5 text-zinc-800">
                        {l.tipo === 'receta' ? recetas.find((r) => r.id === l.refId)?.nombre : nombreDe(l.refId)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-zinc-500">×{l.cantidad}</td>
                      <td className="py-1.5 text-right tabular-nums">{money(l.precio * l.cantidad)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-zinc-300">
                    <td className="py-1.5 font-medium">Total</td>
                    <td />
                    <td className="py-1.5 text-right font-medium tabular-nums">{money(detalle.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-semibold text-zinc-900">
                Consumo de inventario {detalle.aplicada ? '(ya aplicado)' : '(al aplicar)'}
              </h3>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {Object.entries(explotarVenta(detalle, byId(recetas)))
                    .sort((a, b) => nombreDe(a[0]).localeCompare(nombreDe(b[0]), 'es-MX'))
                    .map(([insumoId, qty]) => (
                      <tr key={insumoId} className="border-b border-zinc-100 last:border-0">
                        <td className="py-1 text-zinc-800">{nombreDe(insumoId)}</td>
                        <td className="py-1 text-right tabular-nums text-zinc-600">
                          {cantidad(qty, insumos[insumoId]?.unidad)}
                        </td>
                        <td className="py-1 text-right tabular-nums text-zinc-500">
                          {money(qty * (insumos[insumoId]?.costoUnitario ?? 0))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </Page>
  )
}
