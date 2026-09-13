import { useState } from 'react'
import { Button, Field, Input, Modal, Select } from '@/shared/ui'
import { cantidad } from '@/shared/lib'
import { useInsumosById } from '@/entities/insumo'
import { existencia, useLotes } from '@/entities/lote'
import { cantidadMerma } from '@/entities/movimiento'
import { ETIQUETA_MANUAL, useRegistrarMovimientoManual, type TipoManual } from './api'

export function ModalRegistrarMovimiento({
  abierto,
  onCerrar,
}: {
  abierto: boolean
  onCerrar: () => void
}) {
  const { data: lotes } = useLotes()
  const insumos = useInsumosById()
  const registrar = useRegistrarMovimientoManual()

  const [tipo, setTipo] = useState<TipoManual>('merma')
  const [insumoId, setInsumoId] = useState('')
  const [loteId, setLoteId] = useState('')
  const [modo, setModo] = useState<'cantidad' | 'porcentaje'>('cantidad')
  const [valor, setValor] = useState(0)
  const [motivo, setMotivo] = useState('')

  const insumo = insumos[insumoId]
  const disponibles = (lotes ?? []).filter((l) => l.insumoId === insumoId && l.estado !== 'agotada')
  const total = lotes && insumoId ? existencia(lotes, insumoId).total : 0
  const cantidadFinal = modo === 'porcentaje' ? cantidadMerma(total, valor) : valor

  const enviar = async () => {
    if (!loteId || cantidadFinal <= 0) return
    await registrar.mutateAsync({
      tipo,
      loteId,
      cantidad: cantidadFinal,
      motivo: motivo || ETIQUETA_MANUAL[tipo],
    })
    setValor(0)
    setMotivo('')
    setLoteId('')
    setInsumoId('')
    onCerrar()
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar movimiento manual">
      <div className="flex flex-col gap-3">
        <Field label="Tipo">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoManual)}>
            <option value="merma">Merma</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste (suma existencia)</option>
          </Select>
        </Field>

        <Field label="Insumo">
          <Select
            value={insumoId}
            onChange={(e) => {
              setInsumoId(e.target.value)
              setLoteId('')
            }}
          >
            <option value="">Selecciona un insumo…</option>
            {Object.values(insumos).map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Lote"
          hint={insumoId ? `Existencia total: ${cantidad(total, insumo?.unidad)}` : undefined}
        >
          <Select value={loteId} onChange={(e) => setLoteId(e.target.value)} disabled={!insumoId}>
            <option value="">Selecciona un lote…</option>
            {disponibles.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} · {l.estado} · {cantidad(l.restante, insumo?.unidad)}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Expresar como">
            <Select value={modo} onChange={(e) => setModo(e.target.value as typeof modo)}>
              <option value="cantidad">Cantidad</option>
              <option value="porcentaje">Porcentaje de existencia</option>
            </Select>
          </Field>
          <Field
            label={modo === 'porcentaje' ? 'Porcentaje (%)' : `Cantidad (${insumo?.unidad ?? '—'})`}
            hint={
              modo === 'porcentaje' && insumoId
                ? `= ${cantidad(cantidadFinal, insumo?.unidad)}`
                : undefined
            }
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label="Motivo">
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Derrame en barra, botella rota, corrección de captura…"
          />
        </Field>

        <div className="mt-1 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button
            variante="primary"
            onClick={enviar}
            disabled={!loteId || cantidadFinal <= 0 || registrar.isPending}
          >
            Registrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
