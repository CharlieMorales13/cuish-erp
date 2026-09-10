const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const num = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })
const fechaCorta = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const fechaHora = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export const money = (n: number) => mxn.format(n)
/** Costos unitarios llegan a $0.005/g: por debajo de un centavo se muestran con 3 decimales. */
export const moneyFino = (n: number) => (n < 0.01 && n > 0 ? `$${n.toFixed(3)}` : mxn.format(n))
export const cantidad = (n: number, unidad?: string) =>
  `${num.format(n)}${unidad ? ` ${unidad}` : ''}`
export const pct = (n: number) => `${num.format(n * 100)}%`
export const fecha = (iso: string) => fechaCorta.format(new Date(iso))
export const fechaConHora = (iso: string) => fechaHora.format(new Date(iso))
export const hoyISO = () => new Date().toISOString().slice(0, 10)
