import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '../lib/cn'

const FieldCtx = createContext<{ id: string; errorId?: string }>({ id: '' })

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  return (
    <FieldCtx.Provider value={{ id, errorId }}>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-xs font-medium text-zinc-700">
          {label}
        </label>
        {children}
        {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    </FieldCtx.Provider>
  )
}

export const control =
  'w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none disabled:bg-zinc-100'

/** Enlaza el control con su `<label>` y su mensaje de error sin que cada pantalla lo repita. */
function useControlProps() {
  const { id, errorId } = useContext(FieldCtx)
  return {
    id: id || undefined,
    'aria-describedby': errorId,
    'aria-invalid': errorId ? true : undefined,
  } as const
}

// Los tres controles reenvían la ref: `register()` de react-hook-form devuelve una, y sin
// forwardRef React la tira en silencio — el formulario se ve bien pero nunca se llena ni
// se valida. Lo cazó `form.test.tsx`; no quitar el forwardRef.

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} {...useControlProps()} {...props} className={cn(control, className)} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} {...useControlProps()} {...props} className={cn(control, className)} />
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} {...useControlProps()} {...props} className={cn(control, className)} />
})
