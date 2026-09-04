import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { byId } from './domain/inventario'

export const useInsumos = () => useQuery({ queryKey: ['insumos'], queryFn: api.getInsumos })
export const useRecetas = () => useQuery({ queryKey: ['recetas'], queryFn: api.getRecetas })
export const useProveedores = () => useQuery({ queryKey: ['proveedores'], queryFn: api.getProveedores })
export const useLotes = () => useQuery({ queryKey: ['lotes'], queryFn: api.getLotes })
export const useMovimientos = () => useQuery({ queryKey: ['movimientos'], queryFn: api.getMovimientos })
export const useCompras = () => useQuery({ queryKey: ['compras'], queryFn: api.getCompras })
export const useVentas = () => useQuery({ queryKey: ['ventas'], queryFn: api.getVentas })
export const useConteos = () => useQuery({ queryKey: ['conteos'], queryFn: api.getConteos })
export const useExistencias = () => useQuery({ queryKey: ['existencias'], queryFn: api.getExistencias })

export function useInsumosById() {
  const { data } = useInsumos()
  return byId(data ?? [])
}

/**
 * Toda mutación invalida todo. Con 34 insumos y ~100 lotes eso es gratis, y evita
 * la clase de bug donde una pantalla queda mostrando existencia vieja.
 * ponytail: invalidación total; si el catálogo crece a miles, invalidar por llave.
 */
function useMutacion<A, R>(fn: (arg: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries() })
}

export const useGuardarInsumo = () => useMutacion(api.guardarInsumo)
export const useGuardarReceta = () => useMutacion(api.guardarReceta)
export const useGuardarProveedor = () => useMutacion(api.guardarProveedor)
export const useRegistrarEntrada = () => useMutacion(api.registrarEntrada)
export const useRegistrarMovimiento = () => useMutacion(api.registrarMovimiento)
export const useAbrirBotella = () => useMutacion(api.abrirBotella)
export const useCrearCompra = () => useMutacion(api.crearCompra)
export const useRecibirCompra = () => useMutacion(api.recibirCompra)
export const useDevolverCascos = () =>
  useMutacion(({ compraId, cantidad }: { compraId: string; cantidad: number }) =>
    api.devolverCascos(compraId, cantidad))
export const useAplicarVenta = () => useMutacion(api.aplicarVenta)
export const useCrearConteo = () => useMutacion(api.crearConteo)
export const useGuardarConteo = () =>
  useMutacion(({ conteoId, lineas }: { conteoId: string; lineas: api.Conteo['lineas'] }) =>
    api.guardarConteo(conteoId, lineas))
export const useCerrarConteo = () => useMutacion(api.cerrarConteo)
