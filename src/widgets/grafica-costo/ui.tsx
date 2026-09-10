import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/shared/ui'
import { money } from '@/shared/lib'

export interface BarraCosto {
  nombre: string
  costo: number
}

export function GraficaCosto({
  titulo,
  datos,
  color,
  vacio = 'Sin datos',
}: {
  titulo: string
  datos: BarraCosto[]
  color: string
  vacio?: string
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
              <YAxis
                type="category"
                dataKey="nombre"
                width={130}
                tick={{ fontSize: 11 }}
                stroke="#a1a1aa"
              />
              <Tooltip formatter={(v: number) => money(v)} cursor={{ fill: '#fafafa' }} />
              <Bar dataKey="costo" fill={color} radius={[0, 3, 3, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
