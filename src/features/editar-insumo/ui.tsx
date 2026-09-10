import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Field, Input, Modal, Select } from '@/shared/ui'
import { moneyFino } from '@/shared/lib'
import { UNIDADES } from '@/shared/model/unidades'
import type { Insumo } from '@/shared/api/contracts'
import { costoUnitario } from '@/entities/insumo'
import { esquemaInsumo, type FormularioInsumo } from './model'
import { useGuardarInsumo } from './api'

export const insumoVacio = (): Insumo => ({
  id: '',
  nombre: '',
  categoria: '',
  presentacion: 1,
  unidad: 'ml',
  costoCompra: 0,
  costoUnitario: 0,
  esBotella: false,
  caduca: false,
  min: 0,
  max: 0,
})

export function ModalEditarInsumo({ insumo, onCerrar }: { insumo: Insumo; onCerrar: () => void }) {
  const guardar = useGuardarInsumo()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormularioInsumo>({
    resolver: zodResolver(esquemaInsumo),
    defaultValues: { ...insumo, piezasPorCaja: insumo.piezasPorCaja ?? ('' as unknown as number) },
  })

  // `watch()` de react-hook-form no es memoizable por el compilador de React. Aquí solo
  // alimenta el costo unitario que se muestra en vivo, así que el costo de no memoizar es nulo.
  // eslint-disable-next-line react-hooks/incompatible-library
  const presentacion = Number(watch('presentacion')) || 0
  const costoCompra = Number(watch('costoCompra')) || 0
  const unidad = watch('unidad')

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={insumo.id ? `Editar ${insumo.nombre}` : 'Nuevo insumo'}
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(async (valores) => {
          const datos = esquemaInsumo.parse(valores)
          await guardar.mutateAsync({
            ...datos,
            costoUnitario: costoUnitario(datos.costoCompra, datos.presentacion),
          })
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
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
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
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variante="primary" type="submit" disabled={guardar.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
