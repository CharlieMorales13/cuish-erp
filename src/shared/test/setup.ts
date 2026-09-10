import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { resetDb } from '../api/db'
import { reiniciarSiembra } from '@/features/aplicar-venta'

// recharts mide su contenedor con ResizeObserver, que jsdom no trae.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

// jsdom todavía no implementa el <dialog> nativo. Los modales lo usan, así que se
// parchea aquí en vez de meter una librería de diálogos solo para poder testear.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close() {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
  resetDb()
  reiniciarSiembra()
  sessionStorage.clear()
})

afterEach(cleanup)
