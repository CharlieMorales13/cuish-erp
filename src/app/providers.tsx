import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { reportarError } from '@/shared/lib'

export const crearQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        // Dos intentos más antes de darse por vencido: una consulta que falla por un
        // tropiezo de red no debería mandar al usuario a la pantalla de error.
        retry: 2,
      },
      // Una mutación NO se reintenta sola: puede no ser idempotente y acabaríamos
      // descontando inventario dos veces.
      mutations: { retry: false },
    },
    // Un solo lugar reporta los fallos de todas las acciones. Sin esto, cada botón
    // tendría que acordarse de pintar su propio error, y el que se olvide falla en
    // silencio.
    mutationCache: new MutationCache({ onError: reportarError }),
  })

export function Providers({
  children,
  client = crearQueryClient(),
}: {
  children: ReactNode
  client?: QueryClient
}) {
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}
