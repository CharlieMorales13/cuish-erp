import { useMutacionInvalidante } from '@/shared/api/mutacion'
import { guardarProveedor } from '@/entities/proveedor'

export const useGuardarProveedor = () => useMutacionInvalidante(guardarProveedor)
