import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const crearQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: false },
    },
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
