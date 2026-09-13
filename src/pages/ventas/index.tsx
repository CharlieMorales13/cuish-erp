import { useState } from 'react'
import { Aviso, Badge, Button, Card, EstadoConsulta, Modal, Page, Stat } from '@/shared/ui'
import { byId, cantidad, fechaConHora, money } from '@/shared/lib'
import type { Venta } from '@/shared/api/contracts'
import { pendientesDeAplicar, productosEnTicket, totalVentas, useVentas } from '@/entities/venta'
import { useRecetas } from '@/entities/receta'
import { useInsumosById } from '@/entities/insumo'
import { explotarVenta, useAplicarVenta, type Faltante } from '@/features/aplicar-venta'

export default function VentasPage() {
  const consultaVentas = useVentas()
  const consultaRecetas = useRecetas()
  const ventas = consultaVentas.data
  const recetas = consultaRecetas.data
  const insumos = useInsumosById()
  const aplicar = useAplicarVenta()
  const [detalle, setDetalle] = useState<Venta | null>(null)
  const [faltantes, setFaltantes] = useState<Faltante[]>([])

  if (!ventas || !recetas) return <EstadoConsulta consultas={[consultaVentas, consultaRecetas]} />

  const pendientes = pendientesDeAplicar(ventas)
  const nombreDe = (id: string) => insumos[id]?.nombre ?? id

  const aplicarUna = async (venta: Venta) => {
    const resultado = await aplicar.mutateAsync(venta.id)
    setFaltantes(resultado.faltantes)
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
            onClick={async () => {
              for (const venta of pendientes) await aplicarUna(venta)
            }}
          >
            Aplicar {pendientes.length} pendientes
          </Button>
        ) : undefined
      }
    >
      {faltantes.length > 0 && (
        <Aviso tono="danger">
          Se cerró la cuenta con existencia insuficiente en:{' '}
          {faltantes
            .map(
              (f) =>
                `${nombreDe(f.insumoId)} (${cantidad(f.cantidad, insumos[f.insumoId]?.unidad)})`,
            )
            .join(', ')}
          . El inventario quedó en negativo. La alerta no bloquea el cierre, por diseño.
        </Aviso>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Tickets recibidos" valor={ventas.length} nota="del POS" />
        <Stat
          label="Sin aplicar"
          valor={pendientes.length}
          nota="no han descontado inventario"
          tono={pendientes.length ? 'danger' : undefined}
        />
        <Stat label="Venta total" valor={money(totalVentas(ventas))} />
      </div>

      <Card className="divide-y divide-zinc-100">
        {ventas.map((venta) => (
          <div
            key={venta.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <button onClick={() => setDetalle(venta)} className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-zinc-900">{venta.folio}</span>
                <Badge tono={venta.aplicada ? 'ok' : 'warn'}>
                  {venta.aplicada ? 'inventario aplicado' : 'pendiente'}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">
                {venta.cuenta} · {fechaConHora(venta.fecha)} · {productosEnTicket(venta)} productos
              </p>
              <p className="font-mono text-[11px] text-zinc-400">uuid {venta.id}</p>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium tabular-nums text-zinc-900">
                {money(venta.total)}
              </span>
              {!venta.aplicada && (
                <Button
                  variante="primary"
                  disabled={aplicar.isPending}
                  onClick={() => aplicarUna(venta)}
                >
                  Aplicar al inventario
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>

      {detalle && (
        <Modal
          abierto
          onCerrar={() => setDetalle(null)}
          titulo={`Ticket ${detalle.folio}`}
          ancho="max-w-xl"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600">
              {detalle.cuenta} · {fechaConHora(detalle.fecha)}
            </p>

            <div>
              <h3 className="mb-1 text-sm font-semibold text-zinc-900">Productos vendidos</h3>
              <table className="w-full border-collapse text-sm" aria-label="Productos vendidos">
                <tbody>
                  {detalle.lineas.map((linea, i) => (
                    <tr key={i} className="border-b border-zinc-100 last:border-0">
                      <td className="py-1.5 text-zinc-800">
                        {linea.tipo === 'receta'
                          ? recetas.find((r) => r.id === linea.refId)?.nombre
                          : nombreDe(linea.refId)}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-zinc-500">
                        ×{linea.cantidad}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {money(linea.precio * linea.cantidad)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-zinc-300">
                    <td className="py-1.5 font-medium">Total</td>
                    <td />
                    <td className="py-1.5 text-right font-medium tabular-nums">
                      {money(detalle.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-semibold text-zinc-900">
                Consumo de inventario {detalle.aplicada ? '(ya aplicado)' : '(al aplicar)'}
              </h3>
              <table className="w-full border-collapse text-sm" aria-label="Consumo de inventario">
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
