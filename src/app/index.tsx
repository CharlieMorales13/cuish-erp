import { sembrarVentasAplicadas } from '@/features/aplicar-venta'
import { Providers } from './providers'
import { Router } from './router'
import './index.css'

// La semilla del servidor falso trae ventas ya cobradas en el POS pero sin kardex.
// Se aplican una vez al arrancar para que existencias y movimientos sean coherentes.
sembrarVentasAplicadas()

export function App() {
  return (
    <Providers>
      <Router />
    </Providers>
  )
}
