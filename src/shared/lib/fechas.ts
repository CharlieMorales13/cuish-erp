/**
 * Días que faltan para una caducidad ISO (yyyy-mm-dd). Negativo = ya caducó.
 * Compara a medianoche local para que "hoy" siempre dé 0.
 */
export function diasParaCaducar(caducidad: string | undefined, hoy = new Date()): number | null {
  if (!caducidad) return null
  const DIA = 24 * 60 * 60 * 1000
  const referencia = new Date(hoy)
  referencia.setHours(0, 0, 0, 0)
  return Math.round((new Date(caducidad + 'T00:00:00').getTime() - referencia.getTime()) / DIA)
}
