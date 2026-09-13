import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, EstadoConsulta, Page, Stat } from '@/shared/ui'
import { money } from '@/shared/lib'
import { useExistencias, useLotes } from '@/entities/lote'
import { useInsumos, valorInventario } from '@/entities/insumo'
import { acumularPorInsumo, useMovimientos } from '@/entities/movimiento'
import { pendientesDeAplicar, useVentas } from '@/entities/venta'
import { GraficaCosto, type BarraCosto } from '@/widgets/grafica-costo'
import {
  DIAS_ALERTA_CADUCIDAD,
  ListaBajoMinimo,
  ListaPorCaducar,
  lotesPorCaducar,
} from '@/widgets/alertas-inventario'

export default function DashboardPage() {
  const consultaInsumos = useInsumos()
  const consultaExistencias = useExistencias()
  const consultaLotes = useLotes()
  const consultaMovimientos = useMovimientos()
  const consultaVentas = useVentas()
  const insumos = consultaInsumos.data
  const existencias = consultaExistencias.data
  const lotes = consultaLotes.data
  const movimientos = consultaMovimientos.data
  const ventas = consultaVentas.data

  const resumen = useMemo(() => {
    if (!insumos || !existencias || !lotes || !movimientos) return null

    const nombreDe = (id: string) => insumos.find((i) => i.id === id)?.nombre ?? id
    const costoDe = (id: string) => insumos.find((i) => i.id === id)?.costoUnitario ?? 0

    const top = (acumulado: Record<string, number>): BarraCosto[] =>
      Object.entries(acumulado)
        .map(([id, qty]) => ({
          nombre: nombreDe(id),
          costo: Number((qty * costoDe(id)).toFixed(2)),
        }))
        .sort((a, b) => b.costo - a.costo)
        .slice(0, 8)

    return {
      valor: valorInventario(insumos, existencias),
      bajos: insumos.filter((i) => existencias[i.id].total < i.min),
      porCaducar: lotesPorCaducar(lotes),
      consumo: top(acumularPorInsumo(movimientos, 'venta')),
      merma: top(acumularPorInsumo(movimientos, 'merma')),
      nombreDe,
    }
  }, [insumos, existencias, lotes, movimientos])

  const pendientes = pendientesDeAplicar(ventas ?? [])

  if (!resumen || !insumos || !existencias)
    return (
      <EstadoConsulta
        consultas={[
          consultaInsumos,
          consultaExistencias,
          consultaLotes,
          consultaMovimientos,
          consultaVentas,
        ]}
      />
    )

  return (
    <Page titulo="Dashboard" descripcion="Estado del inventario del bar, un solo almacén.">
      {pendientes.length > 0 && (
        <Aviso tono="info">
          Hay <strong>{pendientes.length}</strong> ventas del POS pendientes de descontar
          inventario.{' '}
          <Link to="/ventas" className="underline">
            Ver ventas
          </Link>
        </Aviso>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          label="Valor del inventario"
          valor={money(resumen.valor)}
          nota="A costo de reposición"
        />
        <Stat
          label="Bajo mínimo"
          valor={resumen.bajos.length}
          nota={`de ${insumos.length} insumos`}
          tono={resumen.bajos.length ? 'danger' : undefined}
        />
        <Stat
          label={`Por caducar (${DIAS_ALERTA_CADUCIDAD} días)`}
          valor={resumen.porCaducar.length}
          nota="lotes"
          tono={resumen.porCaducar.length ? 'danger' : undefined}
        />
        <Stat label="Ventas sin aplicar" valor={pendientes.length} nota="tickets del POS" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GraficaCosto titulo="Consumo por insumo (costo)" datos={resumen.consumo} color="#3f3f46" />
        <GraficaCosto
          titulo="Merma por insumo (costo)"
          datos={resumen.merma}
          color="#dc2626"
          vacio="Sin mermas registradas"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ListaBajoMinimo insumos={resumen.bajos} existencias={existencias} />
        <ListaPorCaducar lotes={resumen.porCaducar} nombreDe={resumen.nombreDe} />
      </div>
    </Page>
  )
}
