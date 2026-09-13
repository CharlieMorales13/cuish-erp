import { useMutacionInvalidante } from '@/shared/api/mutacion'
import { guardarReceta } from '@/entities/receta'

export const useGuardarReceta = () => useMutacionInvalidante(guardarReceta)
