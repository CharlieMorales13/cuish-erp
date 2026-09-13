import { X } from 'lucide-react'
import { descartarAviso, useAvisosDeAccion } from '../lib/avisos'
import { Button } from './button'

/**
 * Errores de acciones que el usuario acaba de intentar. Se pinta fijo arriba a la derecha
 * para que se vea aunque el modal que disparó la acción ya se haya cerrado.
 */
export function AvisosDeAccion() {
  const avisos = useAvisosDeAccion()
  if (avisos.length === 0) return null

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-3 top-3 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4"
    >
      {avisos.map((aviso) => (
        <div
          key={aviso.id}
          role="alert"
          className="pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 shadow-lg ring-1 ring-inset ring-red-200"
        >
          <p className="min-w-0 flex-1 break-words">{aviso.mensaje}</p>
          <Button
            variante="ghost"
            aria-label="Descartar aviso"
            className="shrink-0 px-1 py-0 text-red-700 hover:bg-red-100"
            onClick={() => descartarAviso(aviso.id)}
          >
            <X size={14} aria-hidden />
          </Button>
        </div>
      ))}
    </div>
  )
}
