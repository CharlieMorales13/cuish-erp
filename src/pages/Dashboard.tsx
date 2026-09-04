import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Aviso, Badge, Card, Cargando, Page, Stat } from '../ui'
import { cantidad, money } from '../lib'
import { diasParaCaducar } from '../domain/inventario'
import { useExistencias, useInsumos, useLotes, useMovimientos, useVentas } from '../hooks'

export default function Dashboard() {
  const { data: insumos } = useInsumos()
  const { data: existencias } = useExistencias()
  const { data: lotes } = useLotes()
  const { data: movimientos } = useMovimientos()
  const { data: ventas } = useVentas()

  const resumen = useMemo(() => {
    if (!insumos || !existencias || !lotes || !movimientos) return null

    const valor = insumos.reduce((s, i) => s + existencias[i.id].total * i.costoUnitario, 0)
    const bajos = insumos.filter((i) => existencias[i.id].total < i.min)
    const porCaducar = lotes
      .filter((l) => l.estado !== 'agotada' && l.caducidad)
      .map((l) => ({ lote: l, dias: diasParaCaducar(l.caducidad)! }))
      .filter((x) => x.dias <= 15)
      .sort((a, b) => a.dias - b.dias)

    const consumo: Record<string, number> = {}
    const merma: Record<string, number> = {}
    for (const m of movimientos) {
      if (m.tipo === 'venta') consumo[m.insumoId] = (consumo[m.insumoId] ?? 0) - m.cantidad
      if (m.tipo === 'merma') merma[m.insumoId] = (merma[m.insumoId] ?? 0) - m.cantidad
    }
    const costoDe = (id: string) => insumos.find((i) => i.id === id)?.costoUnitario ?? 0
    const nombreDe = (id: string) => insumos.find((i) => i.id === id)?.nombre ?? id

    const top = (fuente: Record<string, number>) =>
      Object.entries(fuente)
        .map(([id, qty]) => ({ nombre: nombreDe(id), costo: Number((qty * costoDe(id)).toFixed(2)) }))
        .sort((a, b) => b.costo - a.costo)
        .slice(0, 8)

    return { valor, bajos, porCaducar, consumo: top(consumo), merma: top(merma) }
  }, [insumos, existencias, lotes, movimientos])

  const pendientes = ventas?.filter((v) => !v.aplicada) ?? []

  if (!resumen || !insumos || !existencias) return <Cargando />

  return (
    <Page titulo="Dashboard" descripcion="Estado del inventario del bar, un solo almacén.">
      {pendientes.length > 0 && (
        <Aviso tono="info">
          Hay <strong>{pendientes.length}</strong> ventas del POS pendientes de descontar inventario.{' '}
          <Link to="/ventas" className="underline">Ver ventas</Link>
        </Aviso>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Valor del inventario" valor={money(resumen.valor)} nota="A costo de reposición" />
        <Stat label="Bajo mínimo" valor={resumen.bajos.length} nota={`de ${insumos.length} insumos`} tono={resumen.bajos.length ? 'danger' : undefined} />
        <Stat label="Por caducar (15 días)" valor={resumen.porCaducar.length} nota="lotes" tono={resumen.porCaducar.length ? 'danger' : undefined} />
        <Stat label="Ventas sin aplicar" valor={pendientes.length} nota="tickets del POS" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Grafica titulo="Consumo por insumo (costo)" datos={resumen.consumo} color="#3f3f46" />
        <Grafica titulo="Merma por insumo (costo)" datos={resumen.merma} color="#dc2626" vacio="Sin mermas registradas" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Bajo existencia mínima</h2>
          <ul className="mt-3 flex flex-col divide-y divide-zinc-100">
            {resumen.bajos.slice(0, 10).map((i) => (
              <li key={i.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-zinc-800">{i.nombre}</span>
                <span className="flex items-center gap-2 tabular-nums text-zinc-500">
                  {cantidad(existencias[i.id].total, i.unidad)}
                  <Badge tono="danger">mín {cantidad(i.min)}</Badge>
                </span>
              </li>
            ))}
            {resumen.bajos.length === 0 && <li className="py-6 text-center text-sm text-zinc-500">Todo por encima del mínimo.</li>}
          </ul>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Lotes próximos a caducar</h2>
          <ul className="mt-3 flex flex-col divide-y divide-zinc-100">
            {resumen.porCaducar.slice(0, 10).map(({ lote, dias }) => (
              <li key={lote.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-zinc-800">
                  {insumos.find((i) => i.id === lote.insumoId)?.nombre}
                  <span className="ml-2 text-xs text-zinc-400">{lote.id}</span>
                </span>
                <Badge tono={dias < 0 ? 'danger' : dias <= 7 ? 'warn' : 'neutral'}>
                  {dias < 0 ? `caducado hace ${-dias} d` : `${dias} días`}
                </Badge>
              </li>
            ))}
            {resumen.porCaducar.length === 0 && <li className="py-6 text-center text-sm text-zinc-500">Nada caduca en los próximos 15 días.</li>}
          </ul>
        </Card>
      </div>
    </Page>
  )
}

function Grafica({ titulo, datos, color, vacio = 'Sin datos' }: {
  titulo: string; datos: Array<{ nombre: string; costo: number }>; color: string; vacio?: string
}) {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-zinc-900">{titulo}</h2>
      {datos.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">{vacio}</p>
      ) : (
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke="#f4f4f5" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
              <YAxis type="category" dataKey="nombre" width={130} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
              <Tooltip formatter={(v: number) => money(v)} cursor={{ fill: '#fafafa' }} />
              <Bar dataKey="costo" fill={color} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
