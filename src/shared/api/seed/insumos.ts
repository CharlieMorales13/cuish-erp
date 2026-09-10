import type { Insumo } from '../contracts'

// Fuente: docs/productos, tabla "1. Insumos y costeo" (34 insumos, verbatim).
//
// PLACEHOLDER (confirmar con el gerente, ver docs/context.md "Otros pendientes"):
//   - caduca        : "qué productos aplican a caducidad real" sigue pendiente
//   - piezasPorCaja : solo se confirmó cerveza, y cerveza NO está en el catálogo de 34
//   - esBotella     : se asumió para destilados, licores, vinos, salmuera y bitter
//   - min / max     : no vienen en ningún documento. Se derivan de la presentación de
//                     compra (mín 1.5, máx 6) para no inventar 68 números sueltos.
//                     Son editables por insumo en la pantalla de Insumos.
const MIN_PRESENTACIONES = 1.5
const MAX_PRESENTACIONES = 6

type Fila = [
  id: string,
  nombre: string,
  categoria: string,
  presentacion: number,
  unidad: Insumo['unidad'],
  costoCompra: number,
  esBotella: boolean,
  caduca: boolean,
  piezasPorCaja?: number,
]

const raw: Fila[] = [
  ['INS-01', 'Mezcal', 'Destilados', 1000, 'ml', 150.0, true, false],
  ['INS-02', 'Tequila', 'Destilados', 750, 'ml', 665.0, true, false],
  ['INS-03', 'Ginebra Tanqueray', 'Destilados', 750, 'ml', 488.0, true, false],
  ['INS-04', 'Vodka', 'Destilados', 750, 'ml', 299.0, true, false],
  ['INS-05', 'Ron', 'Destilados', 700, 'ml', 195.0, true, false],
  ['INS-06', 'Campari', 'Licores', 750, 'ml', 392.0, true, false],
  ['INS-07', 'Aperol', 'Licores', 700, 'ml', 315.0, true, false],
  ['INS-08', 'St-Germain', 'Licores', 750, 'ml', 705.0, true, false],
  ['INS-09', 'Italicus', 'Licores', 700, 'ml', 990.0, true, false],
  ['INS-10', 'Licor 43', 'Licores', 700, 'ml', 485.0, true, false],
  ['INS-11', 'Licor de café', 'Licores', 1000, 'ml', 250.0, true, false],
  ['INS-12', 'Licor de naranja', 'Licores', 1000, 'ml', 235.0, true, false],
  ['INS-13', 'Vermouth rojo', 'Licores', 1000, 'ml', 569.0, true, false],
  ['INS-14', 'Vermouth seco', 'Licores', 750, 'ml', 565.0, true, false],
  ['INS-15', 'Vino tinto', 'Vinos', 750, 'ml', 150.0, true, false],
  ['INS-16', 'Vino espumoso', 'Vinos', 750, 'ml', 188.0, true, false],
  ['INS-17', 'Hielo', 'Perecederos', 5000, 'g', 24.0, false, false],
  ['INS-18', 'Agua tónica', 'Mezcladores', 296, 'ml', 14.5, false, true, 24],
  ['INS-19', 'Refresco Coca-Cola', 'Mezcladores', 355, 'ml', 13.33, false, true, 24],
  ['INS-20', 'Agua mineral', 'Mezcladores', 600, 'ml', 16.0, false, true, 24],
  ['INS-21', 'Salmuera Bordan', 'Mezcladores', 300, 'ml', 160.0, true, true],
  ['INS-22', 'Bitter de Angostura', 'Mezcladores', 118, 'ml', 389.0, true, false],
  ['INS-23', 'Jugo de tomate especiado', 'Mezcladores', 1000, 'ml', 42.0, false, true],
  ['INS-24', 'Jarabe natural', 'Jarabes', 1000, 'ml', 24.0, false, true],
  ['INS-25', 'Carga de espresso', 'Café', 1, 'carga', 12.0, false, true],
  ['INS-26', 'Jugo de limón', 'Perecederos', 350, 'ml', 18.0, false, true],
  ['INS-27', 'Limón eureka (garnitura)', 'Perecederos', 50, 'pz', 80.0, false, true],
  ['INS-28', 'Jugo de toronja / gajo', 'Perecederos', 450, 'ml', 30.0, false, true],
  ['INS-29', 'Naranja (garnitura)', 'Perecederos', 33, 'pz', 32.0, false, true],
  ['INS-30', 'Hierbabuena', 'Perecederos', 10, 'porcion', 15.0, false, true],
  ['INS-31', 'Aceituna gordal', 'Garnituras', 250, 'pz', 1240.0, false, true],
  ['INS-32', 'Sal de mar', 'Secos', 1000, 'g', 25.0, false, false],
  ['INS-33', 'Sal de gusano', 'Secos', 1000, 'g', 120.0, false, false],
  ['INS-34', 'Popotes', 'Desechables', 50, 'pz', 30.0, false, false],
]

export const INSUMOS: Insumo[] = raw.map(
  ([
    id,
    nombre,
    categoria,
    presentacion,
    unidad,
    costoCompra,
    esBotella,
    caduca,
    piezasPorCaja,
  ]) => ({
    id,
    nombre,
    categoria,
    presentacion,
    unidad,
    costoCompra,
    costoUnitario: costoCompra / presentacion,
    esBotella,
    caduca,
    piezasPorCaja,
    min: presentacion * MIN_PRESENTACIONES,
    max: presentacion * MAX_PRESENTACIONES,
  }),
)

export const CATEGORIAS = [...new Set(INSUMOS.map((i) => i.categoria))]
