import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Badge, Button, Cargando, DataTable, Field, Input, Modal, Page, Select, type Columna } from '../ui'
import { cantidad, money, moneyFino } from '../lib'
import type { Insumo } from '../domain/types'
import { useGuardarInsumo, useInsumos } from '../hooks'

const esquema = z.object({
  id: z.string(),
  nombre: z.string().min(2, 'Escribe el nombre del insumo'),
  categoria: z.string().min(2, 'Escribe una categoría'),
  unidad: z.enum(['ml', 'g', 'pz', 'porcion', 'carga']),
  presentacion: z.coerce.number().positive('La presentación debe ser mayor a cero'),
  costoCompra: z.coerce.number().positive('El costo debe ser mayor a cero'),
  piezasPorCaja: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  min: z.coerce.number().min(0),
  max: z.coerce.number().min(0),
  esBotella: z.boolean(),
  caduca: z.boolean(),
}).refine((v) => v.max >= v.min, { message: 'El máximo no puede ser menor al mínimo', path: ['max'] })

type Form = z.input<typeof esquema>

export default function Insumos() {
  const { data: insumos } = useInsumos()
  const [editando, setEditando] = useState<Insumo | null>(null)

  const columnas = useMemo<Array<Columna<Insumo>>>(() => [
    { key: 'id', header: 'ID', valor: (i) => i.id, className: 'font-mono text-xs text-zinc-500' },
    { key: 'nombre', header: 'Insumo', valor: (i) => i.nombre },
    { key: 'categoria', header: 'Categoría', valor: (i) => i.categoria, render: (i) => <Badge>{i.categoria}</Badge> },
    {
      key: 'presentacion', header: 'Presentación de compra', align: 'right', valor: (i) => i.presentacion,
      render: (i) => <span className="tabular-nums">{cantidad(i.presentacion, i.unidad)}</span>,
    },
    { key: 'costoCompra', header: 'Costo compra', align: 'right', valor: (i) => i.costoCompra, render: (i) => <span className="tabular-nums">{money(i.costoCompra)}</span> },
    {
      key: 'costoUnitario', header: 'Costo unitario', align: 'right', valor: (i) => i.costoUnitario,
      render: (i) => <span className="tabular-nums">{moneyFino(i.costoUnitario)} <span className="text-zinc-400">/ {i.unidad}</span></span>,
    },
    {
      key: 'caja', header: 'Por caja', align: 'right', valor: (i) => i.piezasPorCaja ?? 0,
      render: (i) => i.piezasPorCaja ? <span className="tabular-nums">{i.piezasPorCaja}</span> : <span className="text-zinc-300">—</span>,
    },
    {
      key: 'flags', header: 'Control',
      render: (i) => (
        <span className="flex gap-1">
          {i.esBotella && <Badge tono="info">copeo</Badge>}
          {i.caduca && <Badge tono="warn">caduca</Badge>}
        </span>
      ),
    },
  ], [])

  if (!insumos) return <Cargando />

  return (
    <Page
      titulo="Insumos"
      descripcion="Catálogo y costeo. El costo unitario se calcula desde la presentación de compra."
      acciones={<Button variante="primary" onClick={() => setEditando(nuevo())}>Nuevo insumo</Button>}
    >
      <DataTable datos={insumos} columnas={columnas} rowKey={(i) => i.id} onRowClick={setEditando} vacio="Sin insumos" />
      {editando && <ModalInsumo insumo={editando} onCerrar={() => setEditando(null)} />}
    </Page>
  )
}

const nuevo = (): Insumo => ({
  id: '', nombre: '', categoria: '', presentacion: 1, unidad: 'ml', costoCompra: 0,
  costoUnitario: 0, esBotella: false, caduca: false, min: 0, max: 0,
})

function ModalInsumo({ insumo, onCerrar }: { insumo: Insumo; onCerrar: () => void }) {
  const guardar = useGuardarInsumo()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(esquema),
    defaultValues: { ...insumo, piezasPorCaja: insumo.piezasPorCaja ?? ('' as unknown as number) },
  })

  const presentacion = Number(watch('presentacion')) || 0
  const costoCompra = Number(watch('costoCompra')) || 0
  const unidad = watch('unidad')

  return (
    <Modal abierto onCerrar={onCerrar} titulo={insumo.id ? `Editar ${insumo.nombre}` : 'Nuevo insumo'}>
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(async (v) => {
          const parsed = esquema.parse(v)
          await guardar.mutateAsync({ ...parsed, costoUnitario: parsed.costoCompra / parsed.presentacion } as Insumo)
          onCerrar()
        })}
      >
        <Field label="Nombre" error={errors.nombre?.message}>
          <Input {...register('nombre')} autoFocus />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría" error={errors.categoria?.message}>
            <Input {...register('categoria')} />
          </Field>
          <Field label="Unidad de uso">
            <Select {...register('unidad')}>
              {['ml', 'g', 'pz', 'porcion', 'carga'].map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Presentación de compra (${unidad})`} error={errors.presentacion?.message}>
            <Input type="number" step="0.01" {...register('presentacion')} />
          </Field>
          <Field label="Costo de la presentación" error={errors.costoCompra?.message}>
            <Input type="number" step="0.01" {...register('costoCompra')} />
          </Field>
        </div>

        <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          Costo unitario:{' '}
          <strong className="text-zinc-900">
            {presentacion > 0 ? `${moneyFino(costoCompra / presentacion)} / ${unidad}` : '—'}
          </strong>
        </p>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Existencia mínima" error={errors.min?.message}>
            <Input type="number" step="0.01" {...register('min')} />
          </Field>
          <Field label="Existencia máxima" error={errors.max?.message}>
            <Input type="number" step="0.01" {...register('max')} />
          </Field>
          <Field label="Piezas por caja" hint="Vacío si no se compra por caja">
            <Input type="number" {...register('piezasPorCaja')} />
          </Field>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" {...register('esBotella')} className="size-4" />
            Controlar botella cerrada vs. botella de copeo por separado
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" {...register('caduca')} className="size-4" />
            Registrar fecha de caducidad por lote
          </label>
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" onClick={onCerrar}>Cancelar</Button>
          <Button variante="primary" type="submit" disabled={guardar.isPending}>Guardar</Button>
        </div>
      </form>
    </Modal>
  )
}
