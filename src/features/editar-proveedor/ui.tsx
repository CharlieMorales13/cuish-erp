import { useState } from 'react'
import { Button, Field, Input, Modal } from '@/shared/ui'
import type { Proveedor } from '@/shared/api/contracts'
import { useGuardarProveedor } from './api'

export const proveedorVacio = (): Proveedor => ({
  id: '',
  nombre: '',
  contacto: '',
  telefono: '',
  cascosPrestados: 0,
})

export function ModalEditarProveedor({
  proveedor,
  onCerrar,
}: {
  proveedor: Proveedor
  onCerrar: () => void
}) {
  const guardar = useGuardarProveedor()
  const [datos, setDatos] = useState(proveedor)
  const set = (k: keyof Proveedor, v: string | number) => setDatos((d) => ({ ...d, [k]: v }))

  return (
    <Modal abierto onCerrar={onCerrar} titulo={proveedor.id ? proveedor.nombre : 'Nuevo proveedor'}>
      <div className="flex flex-col gap-3">
        <Field label="Nombre">
          <Input value={datos.nombre} onChange={(e) => set('nombre', e.target.value)} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contacto">
            <Input value={datos.contacto} onChange={(e) => set('contacto', e.target.value)} />
          </Field>
          <Field label="Teléfono">
            <Input value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </Field>
        </div>
        <Field label="Envases prestados" hint="Cascos pendientes de devolver a este proveedor">
          <Input
            type="number"
            min={0}
            value={datos.cascosPrestados}
            onChange={(e) => set('cascosPrestados', Number(e.target.value))}
          />
        </Field>
        <div className="mt-1 flex justify-end gap-2">
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button
            variante="primary"
            disabled={!datos.nombre || guardar.isPending}
            onClick={async () => {
              await guardar.mutateAsync(datos)
              onCerrar()
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
