import type { Insumo } from '../contracts'

// Fuente: docs/productos, tabla "1. Insumos y costeo" (34 insumos, verbatim).
//
// Reglas confirmadas con el cliente:
//   - caduca        : caduca todo MENOS el alcohol (destilados, licores, vinos, cervezas),
//                     que por regla de negocio no se controla por caducidad. Se deriva de
//                     la categoría, no se captura uno por uno.
//   - piezasPorCaja : es el valor por defecto. La caja se define al momento de comprar,
//                     porque el proveedor la cambia; la pantalla de recepción lo permite.
//
// PLACEHOLDER, sin confirmar todavía:
//   - esBotella     : se asumió para destilados, licores, vinos, salmuera y bitter
//   - min / max     : se derivan de la presentación de compra (mín 1.5, máx 6) para no
//                     inventar 68 números sueltos. Editables por insumo en la pantalla.
const MIN_PRESENTACIONES = 1.5
const MAX_PRESENTACIONES = 6

/** El alcohol no se controla por caducidad. Todo lo demás sí. */
const CATEGORIAS_ALCOHOL = ['Destilados', 'Licores', 'Vinos', 'Cervezas']
const caducaPorCategoria = (categoria: string) => !CATEGORIAS_ALCOHOL.includes(categoria)

type Fila = [
  id: string,
  nombre: string,
  categoria: string,
  presentacion: number,
  unidad: Insumo['unidad'],
  costoCompra: number,
  esBotella: boolean,
  piezasPorCaja?: number,
]

const raw: Fila[] = [
  ['INS-01', 'Mezcal', 'Destilados', 1000, 'ml', 150.0, true],
  ['INS-02', 'Tequila', 'Destilados', 750, 'ml', 665.0, true],
  ['INS-03', 'Ginebra Tanqueray', 'Destilados', 750, 'ml', 488.0, true],
  ['INS-04', 'Vodka', 'Destilados', 750, 'ml', 299.0, true],
  ['INS-05', 'Ron', 'Destilados', 700, 'ml', 195.0, true],
  ['INS-06', 'Campari', 'Licores', 750, 'ml', 392.0, true],
  ['INS-07', 'Aperol', 'Licores', 700, 'ml', 315.0, true],
  ['INS-08', 'St-Germain', 'Licores', 750, 'ml', 705.0, true],
  ['INS-09', 'Italicus', 'Licores', 700, 'ml', 990.0, true],
  ['INS-10', 'Licor 43', 'Licores', 700, 'ml', 485.0, true],
  ['INS-11', 'Licor de café', 'Licores', 1000, 'ml', 250.0, true],
  ['INS-12', 'Licor de naranja', 'Licores', 1000, 'ml', 235.0, true],
  ['INS-13', 'Vermouth rojo', 'Licores', 1000, 'ml', 569.0, true],
  ['INS-14', 'Vermouth seco', 'Licores', 750, 'ml', 565.0, true],
  ['INS-15', 'Vino tinto', 'Vinos', 750, 'ml', 150.0, true],
  ['INS-16', 'Vino espumoso', 'Vinos', 750, 'ml', 188.0, true],
  ['INS-17', 'Hielo', 'Perecederos', 5000, 'g', 24.0, false],
  ['INS-18', 'Agua tónica', 'Mezcladores', 296, 'ml', 14.5, false, 24],
  ['INS-19', 'Refresco Coca-Cola', 'Mezcladores', 355, 'ml', 13.33, false, 24],
  ['INS-20', 'Agua mineral', 'Mezcladores', 600, 'ml', 16.0, false, 24],
  ['INS-21', 'Salmuera Bordan', 'Mezcladores', 300, 'ml', 160.0, true],
  ['INS-22', 'Bitter de Angostura', 'Mezcladores', 118, 'ml', 389.0, true],
  ['INS-23', 'Jugo de tomate especiado', 'Mezcladores', 1000, 'ml', 42.0, false],
  ['INS-24', 'Jarabe natural', 'Jarabes', 1000, 'ml', 24.0, false],
  ['INS-25', 'Carga de espresso', 'Café', 1, 'carga', 12.0, false],
  ['INS-26', 'Jugo de limón', 'Perecederos', 350, 'ml', 18.0, false],
  ['INS-27', 'Limón eureka (garnitura)', 'Perecederos', 50, 'pz', 80.0, false],
  ['INS-28', 'Jugo de toronja / gajo', 'Perecederos', 450, 'ml', 30.0, false],
  ['INS-29', 'Naranja (garnitura)', 'Perecederos', 33, 'pz', 32.0, false],
  ['INS-30', 'Hierbabuena', 'Perecederos', 10, 'porcion', 15.0, false],
  ['INS-31', 'Aceituna gordal', 'Garnituras', 250, 'pz', 1240.0, false],
  ['INS-32', 'Sal de mar', 'Secos', 1000, 'g', 25.0, false],
  ['INS-33', 'Sal de gusano', 'Secos', 1000, 'g', 120.0, false],
  ['INS-34', 'Popotes', 'Desechables', 50, 'pz', 30.0, false],
  // Fuera de las 34 del costeo: el cliente confirmó que la cerveza se da de alta como un
  // producto más. Presentación y costo son placeholder hasta ver una factura.
  ['INS-35', 'Cerveza Modelo', 'Cervezas', 1, 'pz', 18.0, false, 24],
]

export const INSUMOS: Insumo[] = raw.map(
  ([id, nombre, categoria, presentacion, unidad, costoCompra, esBotella, piezasPorCaja]) => ({
    id,
    nombre,
    categoria,
    presentacion,
    unidad,
    costoCompra,
    costoUnitario: costoCompra / presentacion,
    esBotella,
    caduca: caducaPorCategoria(categoria),
    piezasPorCaja,
    min: presentacion * MIN_PRESENTACIONES,
    max: presentacion * MAX_PRESENTACIONES,
  }),
)

export const CATEGORIAS = [...new Set(INSUMOS.map((i) => i.categoria))]
