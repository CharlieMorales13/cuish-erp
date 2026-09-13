import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type Variante = 'primary' | 'outline' | 'ghost' | 'danger'

const variantes: Record<Variante, string> = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-400',
  outline: 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
}

export function Button({
  variante = 'outline',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type={type}
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900',
        variantes[variante],
        className,
      )}
    />
  )
}
