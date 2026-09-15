import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-lg border border-zinc-200 bg-white', className)}>{children}</div>
  )
}

export function Page({
  titulo,
  descripcion,
  acciones,
  children,
}: {
  titulo: string
  descripcion?: string
  acciones?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{titulo}</h1>
          {descripcion && <p className="mt-0.5 text-sm text-zinc-500">{descripcion}</p>}
        </div>
        {acciones && <div className="flex gap-2">{acciones}</div>}
      </header>
      {children}
    </div>
  )
}

export const tonos = {
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
}

export type Tono = keyof typeof tonos

export function Badge({ tono = 'neutral', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tonos[tono],
      )}
    >
      {children}
    </span>
  )
}

export function Aviso({ tono = 'warn', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <div className={cn('rounded-md px-3 py-2 text-sm ring-1 ring-inset', tonos[tono])}>
      {children}
    </div>
  )
}

export function Stat({
  label,
  valor,
  nota,
  tono,
}: {
  label: string
  valor: ReactNode
  nota?: string
  tono?: Tono
}) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          tono === 'danger' ? 'text-red-600' : 'text-zinc-900',
        )}
      >
        {valor}
      </p>
      {nota && <p className="mt-0.5 text-xs text-zinc-500">{nota}</p>}
    </Card>
  )
}
