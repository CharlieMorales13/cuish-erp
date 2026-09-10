import { useState } from 'react'
import { Button, Field, Input, Modal, Select } from '@/shared/ui'
import { cantidad, hoyISO } from '@/shared/lib'
import { useInsumosById } from '@/entities/insumo'
import { useProveedores } from '@/entities/proveedor'
import { piezasDeCompra } from './model'
import { useRegistrarEntrada } from './api'

export function ModalRecibirMercancia({
  abierto,
  onCerrar,
}: {
  abierto: boolean
  onCerrar: () => void
}) {
  const insumos = useInsumosById()
  const { data: proveedores } = useProveedores()
  const registrar = useRegistrarEntrada()

  const [insumoId, setInsumoId] = useState('')
  const [presentaciones, setPresentaciones] = useState(1)
  const [unidadCompra, setUnidadCompra] = useState<'pieza' | 'caja'>('pieza')
  const [proveedorId, setProveedorId] = useState('')
  const [marbete, setMarbete] = useState('')
  const [caducidad, setCaducidad] = useState(hoyISO())

  const insumo = insumos[insumoId]
  const porCaja = insumo?.piezasPorCaja
  const piezas = piezasDeCompra(presentaciones, unidadCompra, porCaja)

  const enviar = async () => {
    if (!insumo) return
    await registrar.mutateAsync({
      insumoId,
      presentaciones: piezas,
      costoCompra: insumo.costoCompra,
      proveedorId: proveedorId || undefined,
      marbete: marbete || undefined,
      caducidad: insumo.caduca ? caducidad : undefined,
    })
    setInsumoId('')
    setMarbete('')
    setPresentaciones(1)
    onCerrar()
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Recepción de mercancía">
      <div className="flex flex-col gap-3">
        <Field label="Insumo">
          <Select value={insumoId} onChange={(e) => setInsumoId(e.target.value)}>
            <option value="">Selecciona un insumo…</option>
            {Object.values(insumos).map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad">
            <Input
              type="number"
              min={1}
              value={presentaciones}
              onChange={(e) => setPresentaciones(Number(e.target.value))}
            />
          </Field>
          <Field
            label="Unidad de compra"
            hint={porCaja ? `1 caja = ${porCaja} piezas` : 'Este insumo no se compra por caja'}
          >
            <Select
              value={unidadCompra}
              onChange={(e) => setUnidadCompra(e.target.value as 'pieza' | 'caja')}
              disabled={!porCaja}
            >
              <option value="pieza">Pieza / botella</option>
              <option value="caja">Caja</option>
            </Select>
          </Field>
        </div>

        <Field label="Proveedor">
          <Select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Sin proveedor</option>
            {proveedores?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>

        {insumo?.esBotella && (
          <Field
            label="Marbete"
            hint={
              piezas > 1
                ? 'Con más de una botella el marbete se captura después, uno por lote.'
                : 'Identificador único de fábrica. Trazabilidad interna, sin uso fiscal.'
            }
          >
            <Input
              value={marbete}
              onChange={(e) => setMarbete(e.target.value)}
              disabled={piezas > 1}
              placeholder="M00000000000"
            />
          </Field>
        )}

        {insumo?.caduca && (
          <Field label="Caducidad">
            <Input type="date" value={caducidad} onChange={(e) => setCaducidad(e.target.value)} />
          </Field>
        )}

        {insumo && (
          <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            Entra
            {insumo.esBotella
              ? ` ${piezas} botella${piezas > 1 ? 's' : ''} cerrada${piezas > 1 ? 's' : ''} de ${cantidad(insumo.presentacion, insumo.unidad)}`
              : ` ${cantidad(piezas * insumo.presentacion, insumo.unidad)}`}
            .
          </p>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variante="primary" onClick={enviar} disabled={!insumo || registrar.isPending}>
            Registrar entrada
          </Button>
        </div>
      </div>
    </Modal>
  )
}
