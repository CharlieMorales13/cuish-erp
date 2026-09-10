import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

/** QueryClient sin reintentos ni caché entre tests: cada prueba parte limpia. */
export const crearQueryClientDePrueba = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })

export function renderConProviders(
  ui: ReactElement,
  { ruta = '/', ...options }: RenderOptions & { ruta?: string } = {},
) {
  const client = crearQueryClientDePrueba()
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ruta]}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return { client, ...render(ui, { wrapper: Wrapper, ...options }) }
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
