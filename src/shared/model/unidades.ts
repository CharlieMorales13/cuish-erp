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
 * Onzas que sirve un trago de destilado derecho.
 *
 * La carta del POS lo vende como "Trago 2 oz", así que ese es el valor que manda. El cliente
 * nos había dado 45 ml para el caballito, que son 1.5 oz: son dos medidas distintas para el
 * mismo servicio y falta resolver cuál es la real (ver docs/dudas.md, punto 2.1).
 */
export const TRAGO_OZ = 2

export const TRAGO_ML = onzasAMl(TRAGO_OZ)

/** Medida provisional que dio el cliente para el caballito. Contradice el trago de 2 oz. */
export const CABALLITO_ML = 45
