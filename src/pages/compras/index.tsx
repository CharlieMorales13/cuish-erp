import { useState } from 'react'
import { Aviso, Badge, Button, Card, EstadoConsulta, Page } from '@/shared/ui'
import { cantidad, fecha, money } from '@/shared/lib'
import { cascosPendientes, cascosVivos, totalCompra, useCompras } from '@/entities/compra'
import { useProveedores } from '@/entities/proveedor'
import { useInsumosById } from '@/entities/insumo'
import { ModalCrearCompra } from '@/features/crear-compra'
import { useRecibirCompra } from '@/features/recibir-mercancia'
import { useDevolverCascos } from '@/features/devolver-cascos'

export default function ComprasPage() {
  const consultaCompras = useCompras()
  const consultaProveedores = useProveedores()
  const compras = consultaCompras.data
  const proveedores = consultaProveedores.data
  const insumos = useInsumosById()
  const recibir = useRecibirCompra()
  const devolver = useDevolverCascos()
  const [alta, setAlta] = useState(false)

  if (!compras || !proveedores)
    return <EstadoConsulta consultas={[consultaCompras, consultaProveedores]} />

  const pendientes = cascosVivos(compras)

  return (
    <Page
      titulo="Compras"
      descripcion="Requisición, recepción de mercancía y control de envases prestados."
      acciones={
        <Button variante="primary" onClick={() => setAlta(true)}>
          Nueva requisición
        </Button>
      }
    >
      {pendientes > 0 && (
        <Aviso>
          Hay <strong>{pendientes} envases</strong> prestados sin devolver. El control es por compra
          y se acumula por proveedor.
        </Aviso>
      )}

      <div className="flex flex-col gap-3">
        {compras.map((compra) => {
          const proveedor = proveedores.find((p) => p.id === compra.proveedorId)
          const cascos = cascosPendientes(compra)
          return (
            <Card key={compra.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-zinc-900">
                      {compra.folio}
                    </span>
                    <Badge tono={compra.estado === 'recibida' ? 'ok' : 'warn'}>
                      {compra.estado}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-600">
                    {proveedor?.nombre ?? compra.proveedorId} · {fecha(compra.fecha)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums text-zinc-900">
                    {money(totalCompra(compra.lineas))}
                  </span>
                  {compra.estado === 'requisicion' && (
                    <Button
                      variante="primary"
                      disabled={recibir.isPending}
                      onClick={() => recibir.mutate(compra.id)}
                    >
                      Recibir mercancía
                    </Button>
                  )}
                  {cascos > 0 && (
                    <Button
                      disabled={devolver.isPending}
                      onClick={() => devolver.mutate({ compraId: compra.id, cantidad: cascos })}
                    >
                      Devolver {cascos} cascos
                    </Button>
                  )}
                </div>
              </div>

              <table
                className="mt-3 w-full border-collapse text-sm"
                aria-label={`Partidas de ${compra.folio}`}
              >
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
                  {compra.lineas.map((linea, i) => {
                    const insumo = insumos[linea.insumoId]
                    return (
                      <tr key={i} className="border-b border-zinc-100 last:border-0">
                        <td className="py-1.5 text-zinc-800">{insumo?.nombre ?? linea.insumoId}</td>
                        <td className="py-1.5 text-right tabular-nums">{linea.presentaciones}</td>
                        <td className="py-1.5 text-right tabular-nums text-zinc-500">
                          {money(linea.costoCompra)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-zinc-500">
                          {insumo
                            ? cantidad(linea.presentaciones * insumo.presentacion, insumo.unidad)
                            : '—'}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {money(linea.presentaciones * linea.costoCompra)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {compra.cascosPrestados > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  Envases: {compra.cascosPrestados} prestados, {compra.cascosDevueltos} devueltos.
                </p>
              )}
            </Card>
          )
        })}
        {compras.length === 0 && (
          <p className="py-16 text-center text-sm text-zinc-500">Sin compras registradas.</p>
        )}
      </div>

      <ModalCrearCompra abierto={alta} onCerrar={() => setAlta(false)} />
    </Page>
  )
}
