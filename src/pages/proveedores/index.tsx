import { useMemo, useState } from 'react'
import { Badge, Button, EstadoConsulta, DataTable, Page, type Columna } from '@/shared/ui'
import type { Proveedor } from '@/shared/api/contracts'
import { useProveedores } from '@/entities/proveedor'
import { ModalEditarProveedor, proveedorVacio } from '@/features/editar-proveedor'

export default function ProveedoresPage() {
  const consultaProveedores = useProveedores()
  const proveedores = consultaProveedores.data
  const [editando, setEditando] = useState<Proveedor | null>(null)

  const columnas = useMemo<Array<Columna<Proveedor>>>(
    () => [
      { key: 'id', header: 'ID', valor: (p) => p.id, className: 'font-mono text-xs text-zinc-500' },
      { key: 'nombre', header: 'Proveedor', valor: (p) => p.nombre },
      { key: 'contacto', header: 'Contacto', valor: (p) => p.contacto, className: 'text-zinc-600' },
      {
        key: 'telefono',
        header: 'Teléfono',
        valor: (p) => p.telefono,
        className: 'tabular-nums text-zinc-600',
      },
      {
        key: 'cascos',
        header: 'Envases prestados',
        align: 'right',
        valor: (p) => p.cascosPrestados,
        render: (p) =>
          p.cascosPrestados > 0 ? (
            <Badge tono="warn">{p.cascosPrestados} sin devolver</Badge>
          ) : (
            <span className="text-zinc-300">—</span>
          ),
      },
    ],
    [],
  )

  if (!proveedores) return <EstadoConsulta consultas={[consultaProveedores]} />

  return (
    <Page
      titulo="Proveedores"
      descripcion="Quién surte qué y cuántos envases se le deben."
      acciones={
        <Button variante="primary" onClick={() => setEditando(proveedorVacio())}>
          Nuevo proveedor
        </Button>
      }
    >
      <DataTable
        datos={proveedores}
        columnas={columnas}
        rowKey={(p) => p.id}
        onRowClick={setEditando}
        etiqueta="Proveedores"
        vacio="Sin proveedores"
      />
      {editando && <ModalEditarProveedor proveedor={editando} onCerrar={() => setEditando(null)} />}
    </Page>
  )
}
