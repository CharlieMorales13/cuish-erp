/** Unidad base en la que se mide y descuenta un producto. Espeja `unidad_medida` en la BD. */
export type Unidad = 'ml' | 'g' | 'pz' | 'porcion' | 'carga'

export const UNIDADES: Unidad[] = ['ml', 'g', 'pz', 'porcion', 'carga']

/**
 * El negocio habla de las bebidas en onzas, pero el inventario se guarda en mililitros
 * porque es la unidad de la presentación de compra. La conversión vive solo aquí.
 */
export const ML_POR_ONZA = 29.5735

export const mlAOnzas = (ml: number) => ml / ML_POR_ONZA
export const onzasAMl = (onzas: number) => onzas * ML_POR_ONZA

/**
 * Mililitros que sirve un caballito.
 *
 * PLACEHOLDER: el cliente confirmó 45 ml "por mientras". Falta medir el caballito real y la
 * mezcalina, que todavía no tiene medida asignada.
 */
export const CABALLITO_ML = 45
