import { useMemo, useState } from 'react'
import { Badge, Button, Cargando, DataTable, Field, Input, Modal, Page, type Columna } from '../ui'
import type { Proveedor } from '../domain/types'
import { useGuardarProveedor, useProveedores } from '../hooks'

export default function Proveedores() {
  const { data: proveedores } = useProveedores()
  const [editando, setEditando] = useState<Proveedor | null>(null)

  const columnas = useMemo<Array<Columna<Proveedor>>>(() => [
    { key: 'id', header: 'ID', valor: (p) => p.id, className: 'font-mono text-xs text-zinc-500' },
    { key: 'nombre', header: 'Proveedor', valor: (p) => p.nombre },
    { key: 'contacto', header: 'Contacto', valor: (p) => p.contacto, className: 'text-zinc-600' },
    { key: 'telefono', header: 'Teléfono', valor: (p) => p.telefono, className: 'tabular-nums text-zinc-600' },
    {
      key: 'cascos', header: 'Envases prestados', align: 'right', valor: (p) => p.cascosPrestados,
      render: (p) => p.cascosPrestados > 0
        ? <Badge tono="warn">{p.cascosPrestados} sin devolver</Badge>
        : <span className="text-zinc-300">—</span>,
    },
  ], [])

  if (!proveedores) return <Cargando />

  return (
    <Page
      titulo="Proveedores"
      descripcion="Quién surte qué y cuántos envases se le deben."
      acciones={
        <Button variante="primary" onClick={() => setEditando({ id: '', nombre: '', contacto: '', telefono: '', cascosPrestados: 0 })}>
          Nuevo proveedor
        </Button>
      }
    >
      <DataTable datos={proveedores} columnas={columnas} rowKey={(p) => p.id} onRowClick={setEditando} vacio="Sin proveedores" />
      {editando && <ModalProveedor proveedor={editando} onCerrar={() => setEditando(null)} />}
    </Page>
  )
}

function ModalProveedor({ proveedor, onCerrar }: { proveedor: Proveedor; onCerrar: () => void }) {
  const guardar = useGuardarProveedor()
  const [datos, setDatos] = useState(proveedor)
  const set = (k: keyof Proveedor, v: string | number) => setDatos((d) => ({ ...d, [k]: v }))

  return (
    <Modal abierto onCerrar={onCerrar} titulo={proveedor.id ? proveedor.nombre : 'Nuevo proveedor'}>
      <div className="flex flex-col gap-3">
        <Field label="Nombre"><Input value={datos.nombre} onChange={(e) => set('nombre', e.target.value)} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contacto"><Input value={datos.contacto} onChange={(e) => set('contacto', e.target.value)} /></Field>
          <Field label="Teléfono"><Input value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} /></Field>
        </div>
        <Field label="Envases prestados" hint="Cascos pendientes de devolver a este proveedor">
          <Input type="number" min={0} value={datos.cascosPrestados} onChange={(e) => set('cascosPrestados', Number(e.target.value))} />
        </Field>
        <div className="mt-1 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button
            variante="primary"
            disabled={!datos.nombre || guardar.isPending}
            onClick={async () => { await guardar.mutateAsync(datos); onCerrar() }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
