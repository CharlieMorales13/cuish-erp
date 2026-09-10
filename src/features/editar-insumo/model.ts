import { z } from 'zod'
import { UNIDADES } from '@/shared/model/unidades'

/**
 * Mismo esquema que validará la API. Zod se comparte entre el formulario y el backend
 * para que las reglas no se escriban dos veces ni se separen con el tiempo.
 */
export const esquemaInsumo = z
  .object({
    id: z.string(),
    nombre: z.string().min(2, 'Escribe el nombre del insumo'),
    categoria: z.string().min(2, 'Escribe una categoría'),
    unidad: z.enum(UNIDADES as [string, ...string[]]).pipe(z.custom<(typeof UNIDADES)[number]>()),
    presentacion: z.coerce.number().positive('La presentación debe ser mayor a cero'),
    costoCompra: z.coerce.number().positive('El costo debe ser mayor a cero'),
    piezasPorCaja: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal('').transform(() => undefined)),
    min: z.coerce.number().min(0, 'No puede ser negativo'),
    max: z.coerce.number().min(0, 'No puede ser negativo'),
    esBotella: z.boolean(),
    caduca: z.boolean(),
  })
  .refine((v) => v.max >= v.min, {
    message: 'El máximo no puede ser menor al mínimo',
    path: ['max'],
  })

export type FormularioInsumo = z.input<typeof esquemaInsumo>
