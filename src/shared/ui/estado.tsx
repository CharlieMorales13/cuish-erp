import { AlertTriangle, RotateCw } from 'lucide-react'
import { mensajeDeError } from '../lib/errores'
import { Button } from './button'
import { Card } from './superficies'

export function Cargando({ etiqueta = 'Cargando…' }: { etiqueta?: string }) {
  return (
    <div role="status" aria-live="polite" className="py-16 text-center text-sm text-zinc-500">
      {etiqueta}
    </div>
  )
}

export function PanelError({
  titulo = 'No se pudo cargar la información',
  error,
  onReintentar,
  reintentando,
}: {
  titulo?: string
  error: unknown
  onReintentar?: () => void
  reintentando?: boolean
}) {
  return (
    <Card className="mx-auto my-8 max-w-md p-5">
      <div
        role="alert"
        className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left"
      >
        <AlertTriangle className="shrink-0 text-red-600" size={22} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">{titulo}</p>
          <p className="mt-0.5 break-words text-sm text-zinc-600">{mensajeDeError(error)}</p>
        </div>
        {onReintentar && (
          <Button onClick={onReintentar} disabled={reintentando} className="shrink-0">
            <RotateCw size={14} aria-hidden />
            {reintentando ? 'Reintentando…' : 'Reintentar'}
          </Button>
        )}
      </div>
    </Card>
  )
}

/** Lo mínimo que necesitamos de una consulta de React Query para decidir qué pintar. */
export interface EstadoDeConsulta {
  isError: boolean
  isFetching: boolean
  error: unknown
  refetch: () => unknown
}

/**
 * Qué enseñar mientras una pantalla todavía no tiene datos.
 *
 * Sin esto, el patrón `if (!data) return <Cargando />` convierte cualquier error de red en un
 * "Cargando…" eterno: la pantalla se queda colgada sin decir nada. Contra el servidor falso
 * eso nunca se nota porque nunca falla; contra la API real, sí.
 */
export function EstadoConsulta({
  consultas,
  etiqueta,
}: {
  consultas: EstadoDeConsulta[]
  etiqueta?: string
}) {
  const fallidas = consultas.filter((c) => c.isError)

  if (fallidas.length === 0) return <Cargando etiqueta={etiqueta} />

  return (
    <PanelError
      error={fallidas[0].error}
      reintentando={fallidas.some((c) => c.isFetching)}
      onReintentar={() => fallidas.forEach((c) => c.refetch())}
    />
  )
}
