import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/cn'
import { Button } from './button'

/**
 * Diálogo sobre el `<dialog>` nativo: foco atrapado, cierre con Escape y `::backdrop`
 * salen de la plataforma, no de una librería.
 */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  ancho = 'max-w-lg',
}: {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  children: ReactNode
  ancho?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar()
      }}
      className={cn('w-[calc(100vw-2rem)] rounded-lg p-0 backdrop:bg-zinc-900/40', ancho)}
    >
      {abierto && (
        <div className="flex max-h-[80vh] flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">{titulo}</h2>
            <Button variante="ghost" onClick={onCerrar} aria-label="Cerrar" className="px-1.5">
              <X size={16} />
            </Button>
          </div>
          <div className="overflow-y-auto p-4">{children}</div>
        </div>
      )}
    </dialog>
  )
}
