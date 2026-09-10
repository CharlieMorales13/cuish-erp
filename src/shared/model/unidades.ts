/** Unidad base en la que se mide y descuenta un producto. Espeja `unidad_medida` en la BD. */
export type Unidad = 'ml' | 'g' | 'pz' | 'porcion' | 'carga'

export const UNIDADES: Unidad[] = ['ml', 'g', 'pz', 'porcion', 'carga']
