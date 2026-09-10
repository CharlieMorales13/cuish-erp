import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Field, Input } from '@/shared/ui'
import { iniciarSesion } from '@/features/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('Gerente')

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-100 px-4">
      <Card className="w-full max-w-sm p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Cuish</p>
        <h1 className="mt-1 text-lg font-semibold text-zinc-900">ERP de inventario</h1>
        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            iniciarSesion(nombre)
            navigate('/')
          }}
        >
          <Field label="Usuario">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </Field>
          <Field label="Contraseña" hint="Autenticación pendiente de definir con el backend.">
            <Input type="password" defaultValue="demo" />
          </Field>
          <Button variante="primary" type="submit" className="mt-1 w-full">
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  )
}
