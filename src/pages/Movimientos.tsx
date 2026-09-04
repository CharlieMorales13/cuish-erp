import { useMemo, useState } from 'react'
import { Badge, Button, Cargando, DataTable, Field, Input, Modal, Page, Select, type Columna } from '../ui'
import { cantidad, fechaConHora } from '../lib'
import { cantidadMerma, existencia } from '../domain/inventario'
import type { Movimiento, TipoMovimiento } from '../domain/types'
import { useInsumosById, useLotes, useMovimientos, useRegistrarMovimiento } from '../hooks'

const TONO: Record<TipoMovimiento, 'ok' | 'warn' | 'danger' | 'info' | 'neutral'> = {
  entrada: 'ok', salida: 'warn', ajuste: 'info', merma: 'danger',
  apertura: 'neutral', venta: 'neutral', conteo: 'info',
}

export default function Movimientos() {
  const { data: movimientos } = useMovimientos()
  const insumos = useInsumosById()
  const [manual, setManual] = useState(false)

  const columnas = useMemo<Array<Columna<Movimiento>>>(() => [
    { key: 'fecha', header: 'Fecha', valor: (m) => m.fecha, render: (m) => <span className="whitespace-nowrap text-zinc-600">{fechaConHora(m.fecha)}</span> },
    { key: 'tipo', header: 'Tipo', valor: (m) => m.tipo, render: (m) => <Badge tono={TONO[m.tipo]}>{m.tipo}</Badge> },
    { key: 'insumo', header: 'Insumo', valor: (m) => insumos[m.insumoId]?.nombre ?? m.insumoId },
    { key: 'lote', header: 'Lote', valor: (m) => m.loteId ?? '', render: (m) => <span className="font-mono text-xs text-zinc-500">{m.loteId ?? '—'}</span> },
    {
      key: 'cantidad', header: 'Cantidad', align: 'right', valor: (m) => m.cantidad,
      render: (m) => (
        <span className={m.cantidad < 0 ? 'tabular-nums text-red-600' : m.cantidad > 0 ? 'tabular-nums text-emerald-700' : 'tabular-nums text-zinc-400'}>
          {m.cantidad > 0 ? '+' : ''}{cantidad(m.cantidad, insumos[m.insumoId]?.unidad)}
        </span>
      ),
    },
    { key: 'motivo', header: 'Motivo', valor: (m) => m.motivo ?? '', className: 'text-zinc-600' },
    { key: 'ref', header: 'Referencia', valor: (m) => m.ref ?? '', className: 'font-mono text-xs text-zinc-500' },
    { key: 'usuario', header: 'Usuario', valor: (m) => m.usuario, className: 'text-zinc-500' },
  ], [insumos])

  if (!movimientos) return <Cargando />

  return (
    <Page
      titulo="Movimientos"
      descripcion="Kardex del almacén: entradas, salidas, ajustes, mermas, aperturas y consumo por venta."
      acciones={<Button variante="primary" onClick={() => setManual(true)}>Registrar movimiento</Button>}
    >
      <DataTable datos={movimientos} columnas={columnas} rowKey={(m) => m.id} vacio="Sin movimientos" />
      <ModalManual abierto={manual} onCerrar={() => setManual(false)} />
    </Page>
  )
}

function ModalManual({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { data: lotes } = useLotes()
  const insumos = useInsumosById()
  const registrar = useRegistrarMovimiento()

  const [tipo, setTipo] = useState<'salida' | 'ajuste' | 'merma'>('merma')
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
    await registrar.mutateAsync({ tipo, loteId, cantidad: cantidadFinal, motivo: motivo || tipoLabel[tipo] })
    setValor(0); setMotivo(''); setLoteId(''); setInsumoId('')
    onCerrar()
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar movimiento manual">
      <div className="flex flex-col gap-3">
        <Field label="Tipo">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
            <option value="merma">Merma</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste (suma existencia)</option>
          </Select>
        </Field>

        <Field label="Insumo">
          <Select value={insumoId} onChange={(e) => { setInsumoId(e.target.value); setLoteId('') }}>
            <option value="">Selecciona un insumo…</option>
            {Object.values(insumos).map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </Select>
        </Field>

        <Field label="Lote" hint={insumoId ? `Existencia total: ${cantidad(total, insumo?.unidad)}` : undefined}>
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
            hint={modo === 'porcentaje' && insumoId ? `= ${cantidad(cantidadFinal, insumo?.unidad)}` : undefined}
          >
            <Input type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
          </Field>
        </div>

        <Field label="Motivo">
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Derrame en barra, botella rota, corrección de captura…" />
        </Field>

        <div className="mt-1 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variante="primary" onClick={enviar} disabled={!loteId || cantidadFinal <= 0 || registrar.isPending}>
            Registrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const tipoLabel = { salida: 'Salida manual', ajuste: 'Ajuste manual', merma: 'Merma' }
