import { useMutacionInvalidante } from '@/shared/api/mutacion'
import { guardarInsumo } from '@/entities/insumo'

export const useGuardarInsumo = () => useMutacionInvalidante(guardarInsumo)
