import type { Insumo } from '../contracts'

// Catálogo alineado al de la base compartida (proyecto `dbcuish`, leído el 2026-09-12).
//
// Los NOMBRES salen tal cual del POS. Lo que el POS no modela y el ERP sí, se agrega aquí:
//
//   - Qué producto es un INSUMO. En la base, los 44 productos tienen `es_insumo = false`,
//     así que no hay nada que descontar. Aquí se marca lo que realmente se almacena.
//   - La UNIDAD real. En la base todo está en `pz`, incluidas las botellas de 750 ml. Un
//     trago de 2 oz no se puede restar de una pieza, así que los destilados y los graneles
//     pasan a mililitros.
//   - CONTROL POR LOTE y CADUCIDAD. En la base están apagados en los 44 productos, lo que
//     dejaría sin piso los requisitos de lote, marbete, caducidad y copeo.
//   - La PRESENTACIÓN DE COMPRA y su costo.
//
// Los insumos que no aparecen como producto en el POS se dedujeron de los nombres de sus
// variantes de venta: "Margarita de Mezcal - Triple sec premium" implica que hay triple sec
// en el almacén. Van marcados abajo.
//
// PLACEHOLDER — ningún costo viene de la base: `compra` y `compra_linea` están vacías y el
// catálogo no guarda costo. Todos los costos de compra son estimados y hay que reemplazarlos
// con una factura real.

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
  // --- Mezcales. Son producto del POS; aquí se les pone unidad real y control por lote ---
  ['INS-01', 'Espadín Joven', 'Destilados', 750, 'ml', 250.0, true],
  ['INS-02', 'Tobalá', 'Destilados', 750, 'ml', 500.0, true],
  ['INS-03', 'Pechuga Artesanal', 'Destilados', 750, 'ml', 580.0, true],
  // Deducido: lo nombra "Margarita de Mezcal - Mezcal reposado", pero no existe como producto
  ['INS-04', 'Mezcal Reposado', 'Destilados', 750, 'ml', 320.0, true],

  // --- Licores y preparados de barra. Todos deducidos de nombres de variantes ---
  ['INS-05', 'Triple sec premium', 'Licores', 750, 'ml', 235.0, true],
  ['INS-06', 'Rosita de cacao', 'Licores', 750, 'ml', 220.0, true],
  ['INS-07', 'Fatwash de mezcal', 'Licores', 750, 'ml', 260.0, true],

  // --- Cervezas. Cada presentación del POS es una partida distinta de almacén ---
  ['INS-08', 'Cerveza Artesanal IPA - Botella 1 L', 'Cervezas', 1, 'pz', 60.0, false, 12],
  ['INS-09', 'Cerveza Artesanal IPA - Lata 355 ml', 'Cervezas', 1, 'pz', 28.0, false, 24],
  ['INS-10', 'Cerveza Clara - Lata 355 ml', 'Cervezas', 1, 'pz', 18.0, false, 24],
  ['INS-11', 'Cerveza Stout - Lata 355 ml', 'Cervezas', 1, 'pz', 26.0, false, 24],

  // --- Aguas de sol. Se venden por vaso y por jarra, así que se almacenan a granel ---
  ['INS-12', 'Agua de sol Jamaica', 'Mezcladores', 1000, 'ml', 30.0, false],
  ['INS-13', 'Agua de sol Tamarindo', 'Mezcladores', 1000, 'ml', 30.0, false],

  // --- Bebidas embotelladas, se venden tal cual ---
  ['INS-14', 'Agua mineral - Botella 355 ml', 'Mezcladores', 1, 'pz', 16.0, false, 24],
  ['INS-15', 'Refresco - Lata 355 ml', 'Mezcladores', 1, 'pz', 13.0, false, 24],

  // --- Insumos de coctelería, deducidos de los nombres de las variantes ---
  ['INS-16', 'Jugo de limón', 'Perecederos', 350, 'ml', 18.0, false],
  ['INS-17', 'Jugo de toronja', 'Perecederos', 450, 'ml', 30.0, false],
  ['INS-18', 'Concentrado de jamaica', 'Jarabes', 1000, 'ml', 45.0, false],
  ['INS-19', 'Orgeat', 'Jarabes', 750, 'ml', 180.0, false],
  ['INS-20', 'Canela', 'Secos', 100, 'g', 45.0, false],
  ['INS-21', 'Chile en polvo', 'Secos', 100, 'g', 35.0, false],
  ['INS-22', 'Hielo', 'Perecederos', 5000, 'g', 24.0, false],
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
