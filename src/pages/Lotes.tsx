import { useMemo, useState } from 'react'
import { Badge, Button, Cargando, DataTable, Field, Input, Modal, Page, Select, type Columna } from '../ui'
import { cantidad, fecha, hoyISO } from '../lib'
import { diasParaCaducar } from '../domain/inventario'
import type { Lote } from '../domain/types'
import { useAbrirBotella, useInsumosById, useLotes, useProveedores, useRegistrarEntrada } from '../hooks'

export default function Lotes() {
  const { data: lotes } = useLotes()
  const insumos = useInsumosById()
  const [alta, setAlta] = useState(false)
  const abrir = useAbrirBotella()

  const columnas = useMemo<Array<Columna<Lote>>>(() => [
    { key: 'id', header: 'Lote', valor: (l) => l.id, className: 'font-mono text-xs text-zinc-500' },
    { key: 'insumo', header: 'Insumo', valor: (l) => insumos[l.insumoId]?.nombre ?? l.insumoId },
    {
      key: 'estado', header: 'Estado', valor: (l) => l.estado,
      render: (l) => (
        <Badge tono={l.estado === 'cerrada' ? 'info' : l.estado === 'abierta' ? 'ok' : 'neutral'}>
          {l.estado === 'cerrada' ? 'Botella cerrada' : l.estado === 'abierta' ? 'Abierta / copeo' : 'Agotada'}
        </Badge>
      ),
    },
    {
      key: 'restante', header: 'Restante', align: 'right', valor: (l) => l.restante,
      render: (l) => (
        <span className={l.restante < 0 ? 'font-medium tabular-nums text-red-600' : 'tabular-nums'}>
          {cantidad(l.restante, insumos[l.insumoId]?.unidad)}
        </span>
      ),
    },
    {
      key: 'consumido', header: 'Consumido', align: 'right', valor: (l) => l.inicial - l.restante,
      render: (l) => <span className="tabular-nums text-zinc-500">{cantidad(l.inicial - l.restante)}</span>,
    },
    { key: 'marbete', header: 'Marbete', valor: (l) => l.marbete ?? '', render: (l) => <span className="font-mono text-xs">{l.marbete ?? '—'}</span> },
    {
      key: 'caducidad', header: 'Caducidad', valor: (l) => l.caducidad ?? '9999',
      render: (l) => {
        if (!l.caducidad) return <span className="text-zinc-300">no aplica</span>
        const dias = diasParaCaducar(l.caducidad)!
        return (
          <span className="flex items-center gap-2">
            {fecha(l.caducidad)}
            {dias <= 15 && <Badge tono={dias < 0 ? 'danger' : 'warn'}>{dias < 0 ? 'caducado' : `${dias} d`}</Badge>}
          </span>
        )
      },
    },
    { key: 'recibido', header: 'Recibido', valor: (l) => l.recibido, render: (l) => fecha(l.recibido) },
    {
      key: 'accion', header: '',
      render: (l) => l.estado === 'cerrada' ? (
        <Button
          onClick={() => abrir.mutate(l.id)}
          disabled={abrir.isPending}
          className="px-2 py-1 text-xs"
        >
          Abrir botella
        </Button>
      ) : null,
    },
  ], [insumos, abrir])

  if (!lotes) return <Cargando />

  return (
    <Page
      titulo="Lotes y marbetes"
      descripcion="Cada botella es una partida. El copeo consume solo de botellas abiertas, la más vieja primero."
      acciones={<Button variante="primary" onClick={() => setAlta(true)}>Recibir mercancía</Button>}
    >
      <DataTable datos={lotes} columnas={columnas} rowKey={(l) => l.id} vacio="Sin lotes" />
      <ModalEntrada abierto={alta} onCerrar={() => setAlta(false)} />
    </Page>
  )
}

function ModalEntrada({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const insumos = useInsumosById()
  const { data: proveedores } = useProveedores()
  const registrar = useRegistrarEntrada()
  const lista = Object.values(insumos)

  const [insumoId, setInsumoId] = useState('')
  const [presentaciones, setPresentaciones] = useState(1)
  const [unidadCompra, setUnidadCompra] = useState<'pieza' | 'caja'>('pieza')
  const [proveedorId, setProveedorId] = useState('')
  const [marbete, setMarbete] = useState('')
  const [caducidad, setCaducidad] = useState(hoyISO())

  const insumo = insumos[insumoId]
  const porCaja = insumo?.piezasPorCaja
  const piezas = presentaciones * (unidadCompra === 'caja' && porCaja ? porCaja : 1)

  const enviar = async () => {
    if (!insumo) return
    await registrar.mutateAsync({
      insumoId, presentaciones: piezas, costoCompra: insumo.costoCompra,
      proveedorId: proveedorId || undefined,
      marbete: marbete || undefined,
      caducidad: insumo.caduca ? caducidad : undefined,
    })
    setInsumoId(''); setMarbete(''); setPresentaciones(1)
    onCerrar()
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Recepción de mercancía">
      <div className="flex flex-col gap-3">
        <Field label="Insumo">
          <Select value={insumoId} onChange={(e) => setInsumoId(e.target.value)}>
            <option value="">Selecciona un insumo…</option>
            {lista.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad">
            <Input type="number" min={1} value={presentaciones} onChange={(e) => setPresentaciones(Number(e.target.value))} />
          </Field>
          <Field label="Unidad de compra" hint={porCaja ? `1 caja = ${porCaja} piezas` : 'Este insumo no se compra por caja'}>
            <Select value={unidadCompra} onChange={(e) => setUnidadCompra(e.target.value as 'pieza' | 'caja')} disabled={!porCaja}>
              <option value="pieza">Pieza / botella</option>
              <option value="caja">Caja</option>
            </Select>
          </Field>
        </div>

        <Field label="Proveedor">
          <Select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Sin proveedor</option>
            {proveedores?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
        </Field>

        {insumo?.esBotella && (
          <Field
            label="Marbete"
            hint={piezas > 1 ? 'Con más de una botella el marbete se captura después, uno por lote.' : 'Identificador único de fábrica. Trazabilidad interna, sin uso fiscal.'}
          >
            <Input value={marbete} onChange={(e) => setMarbete(e.target.value)} disabled={piezas > 1} placeholder="M00000000000" />
          </Field>
        )}

        {insumo?.caduca && (
          <Field label="Caducidad">
            <Input type="date" value={caducidad} onChange={(e) => setCaducidad(e.target.value)} />
          </Field>
        )}

        {insumo && (
          <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            Entra{insumo.esBotella
              ? ` ${piezas} botella${piezas > 1 ? 's' : ''} cerrada${piezas > 1 ? 's' : ''} de ${cantidad(insumo.presentacion, insumo.unidad)}`
              : ` ${cantidad(piezas * insumo.presentacion, insumo.unidad)}`}.
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
