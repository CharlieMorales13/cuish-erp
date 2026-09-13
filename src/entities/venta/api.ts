import { useQuery } from '@tanstack/react-query'
import { db, delay } from '@/shared/api/db'

export const ventaKeys = { todas: ['ventas'] as const }

export const getVentas = () => delay(db.ventas)

export const useVentas = () => useQuery({ queryKey: ventaKeys.todas, queryFn: getVentas })

export const ventasActuales = () => db.ventas

export const buscarVenta = (id: string) => db.ventas.find((v) => v.id === id)
