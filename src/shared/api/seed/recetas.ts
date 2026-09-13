import type { Receta, RecetaIngrediente } from '../contracts'
import { TRAGO_ML, onzasAMl } from '../../model/unidades'

// Carta alineada a la base compartida (proyecto `dbcuish`, leída el 2026-09-12).
//
// NOMBRES, PRECIOS, PADRE y CATEGORÍA DE MENÚ salen tal cual del POS: son los 34 productos
// con `es_vendible = true`. No se inventó ninguno ni se cambió un precio.
//
// Lo que el POS no tiene y el ERP necesita son los INGREDIENTES: la tabla `receta` de la base
// está vacía, así que sin esto no hay nada que descontar al vender.
//
// PLACEHOLDER — las dosis las armamos nosotros. De la carta solo se puede deducir QUÉ lleva
// cada variante, porque el nombre lo dice ("Margarita de Mezcal - Triple sec premium"), pero
// no CUÁNTO. Hay que sentarse con el barman a dosificar cada una antes de costear en serio.

const VASO_16_OZ = onzasAMl(16)
const JARRA_1_L = 1000
const COPA_FLIGHT = onzasAMl(1)

const HIELO_VASO = 150
const HIELO_HIGHBALL = 180

type Def = {
  id: string
  nombre: string
  padre?: string
  categoriaMenu: string
  cristaleria: string
  metodo: string
  garnitura: string
  precio: number
  ingredientes: RecetaIngrediente[]
}

const ing = (insumoId: string, cantidad: number): RecetaIngrediente => ({ insumoId, cantidad })
const hielo = (g: number): RecetaIngrediente => ({ insumoId: 'INS-22', cantidad: g })

const defs: Def[] = [
  // ------------------------------------------------------------------ Mezcal
  {
    id: 'REC-01',
    nombre: 'Espadín Joven - Trago 2 oz',
    padre: 'Espadín Joven',
    categoriaMenu: 'Mezcal',
    cristaleria: 'Copita de barro',
    metodo: 'Derecho',
    garnitura: 'Sal de gusano',
    precio: 65,
    ingredientes: [ing('INS-01', TRAGO_ML)],
  },
  {
    id: 'REC-02',
    nombre: 'Espadín Joven - Botella 750 ml',
    padre: 'Espadín Joven',
    categoriaMenu: 'Mezcal',
    cristaleria: 'Botella',
    metodo: 'Sin preparar',
    garnitura: 'Sin garnitura',
    precio: 450,
    ingredientes: [ing('INS-01', 750)],
  },
  {
    id: 'REC-03',
    nombre: 'Tobalá - Trago 2 oz',
    padre: 'Tobalá',
    categoriaMenu: 'Mezcal',
    cristaleria: 'Copita de barro',
    metodo: 'Derecho',
    garnitura: 'Sal de gusano',
    precio: 95,
    ingredientes: [ing('INS-02', TRAGO_ML)],
  },
  {
    id: 'REC-04',
    nombre: 'Tobalá - Botella 750 ml',
    padre: 'Tobalá',
    categoriaMenu: 'Mezcal',
    cristaleria: 'Botella',
    metodo: 'Sin preparar',
    garnitura: 'Sin garnitura',
    precio: 850,
    ingredientes: [ing('INS-02', 750)],
  },
  {
    id: 'REC-05',
    nombre: 'Pechuga Artesanal - Trago 2 oz',
    padre: 'Pechuga Artesanal',
    categoriaMenu: 'Mezcal',
    cristaleria: 'Copita de barro',
    metodo: 'Derecho',
    garnitura: 'Sal de gusano',
    precio: 140,
    ingredientes: [ing('INS-03', TRAGO_ML)],
  },
  {
    id: 'REC-06',
    nombre: 'Pechuga Artesanal - Botella 750 ml',
    padre: 'Pechuga Artesanal',
    categoriaMenu: 'Mezcal',
    cristaleria: 'Botella',
    metodo: 'Sin preparar',
    garnitura: 'Sin garnitura',
    precio: 980,
    ingredientes: [ing('INS-03', 750)],
  },

  // ---------------------------------------------------------------- Cervezas
  {
    id: 'REC-07',
    nombre: 'Cerveza Artesanal IPA - Lata 355 ml',
    padre: 'Cerveza Artesanal IPA',
    categoriaMenu: 'Cervezas',
    cristaleria: 'Lata',
    metodo: 'Sin preparar',
    garnitura: 'Sin garnitura',
    precio: 55,
    ingredientes: [ing('INS-09', 1)],
  },
  {
    id: 'REC-08',
    nombre: 'Cerveza Artesanal IPA - Botella 1 L',
    padre: 'Cerveza Artesanal IPA',
    categoriaMenu: 'Cervezas',
    cristaleria: 'Botella',
    metodo: 'Sin preparar',
    garnitura: 'Sin garnitura',
    precio: 120,
    ingredientes: [ing('INS-08', 1)],
  },
  {
    id: 'REC-09',
    nombre: 'Cerveza Clara - Lata 355 ml',
    categoriaMenu: 'Cervezas',
    cristaleria: 'Lata',
    metodo: 'Sin preparar',
    garnitura: 'Sin garnitura',
    precio: 45,
    ingredientes: [ing('INS-10', 1)],
  },
  {
    id: 'REC-10',
    nombre: 'Cerveza Stout - Lata 355 ml',
    categoriaMenu: 'Cervezas',
    cristaleria: 'Lata',
    metodo: 'Sin preparar',
    garnitura: 'Sin garnitura',
    precio: 60,
    ingredientes: [ing('INS-11', 1)],
  },

  // ----------------------------------------------------------- Degustaciones
  {
    id: 'REC-11',
    nombre: 'Flight de 3 Mezcales - Tres copas',
    categoriaMenu: 'Degustaciones',
    cristaleria: 'Tres copitas',
    metodo: 'Derecho',
    garnitura: 'Sal de gusano y naranja',
    precio: 180,
    ingredientes: [
      ing('INS-01', COPA_FLIGHT),
      ing('INS-02', COPA_FLIGHT),
      ing('INS-03', COPA_FLIGHT),
    ],
  },
  {
    // PLACEHOLDER: son cinco copas pero el catálogo del POS solo tiene cuatro mezcales.
    // Falta saber cuáles cinco entran en la degustación grande.
    id: 'REC-12',
    nombre: 'Flight de 5 Mezcales - Cinco copas',
    categoriaMenu: 'Degustaciones',
    cristaleria: 'Cinco copitas',
    metodo: 'Derecho',
    garnitura: 'Sal de gusano y naranja',
    precio: 280,
    ingredientes: [
      ing('INS-01', COPA_FLIGHT * 2),
      ing('INS-02', COPA_FLIGHT),
      ing('INS-03', COPA_FLIGHT),
      ing('INS-04', COPA_FLIGHT),
    ],
  },

  // ------------------------------------------------------------- Coctelería
  {
    id: 'REC-13',
    nombre: 'Cozana - Orgeat',
    padre: 'Cozana',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Old Fashioned',
    metodo: 'Shakeado',
    garnitura: 'Sin garnitura',
    precio: 110,
    ingredientes: [ing('INS-01', 45), ing('INS-19', 30), ing('INS-16', 15), hielo(HIELO_VASO)],
  },
  {
    id: 'REC-14',
    nombre: 'Cozana - Fatwash',
    padre: 'Cozana',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Old Fashioned',
    metodo: 'Shakeado',
    garnitura: 'Sin garnitura',
    precio: 115,
    ingredientes: [ing('INS-07', 60), ing('INS-19', 15), ing('INS-16', 15), hielo(HIELO_VASO)],
  },
  {
    id: 'REC-15',
    nombre: 'Cozana - Mezcal espadín',
    padre: 'Cozana',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Old Fashioned',
    metodo: 'Shakeado',
    garnitura: 'Sin garnitura',
    precio: 120,
    ingredientes: [ing('INS-01', 60), ing('INS-19', 15), ing('INS-16', 15), hielo(HIELO_VASO)],
  },
  {
    id: 'REC-16',
    nombre: 'Cozana - Rosita de cacao',
    padre: 'Cozana',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Old Fashioned',
    metodo: 'Shakeado',
    garnitura: 'Sin garnitura',
    precio: 125,
    ingredientes: [ing('INS-01', 45), ing('INS-06', 30), ing('INS-16', 15), hielo(HIELO_VASO)],
  },
  {
    id: 'REC-17',
    nombre: 'Margarita de Mezcal - Limón natural',
    padre: 'Margarita de Mezcal',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Martini',
    metodo: 'Shakeado',
    garnitura: 'Escarchado de sal',
    precio: 90,
    ingredientes: [ing('INS-01', 45), ing('INS-05', 20), ing('INS-16', 30), hielo(HIELO_VASO)],
  },
  {
    id: 'REC-18',
    nombre: 'Margarita de Mezcal - Triple sec premium',
    padre: 'Margarita de Mezcal',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Martini',
    metodo: 'Shakeado',
    garnitura: 'Escarchado de sal',
    precio: 100,
    ingredientes: [ing('INS-01', 45), ing('INS-05', 30), ing('INS-16', 30), hielo(HIELO_VASO)],
  },
  {
    id: 'REC-19',
    nombre: 'Margarita de Mezcal - Mezcal espadín',
    padre: 'Margarita de Mezcal',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Martini',
    metodo: 'Shakeado',
    garnitura: 'Escarchado de sal',
    precio: 110,
    ingredientes: [ing('INS-01', 60), ing('INS-05', 20), ing('INS-16', 30), hielo(HIELO_VASO)],
  },
  {
    id: 'REC-20',
    nombre: 'Margarita de Mezcal - Mezcal reposado',
    padre: 'Margarita de Mezcal',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Martini',
    metodo: 'Shakeado',
    garnitura: 'Escarchado de sal',
    precio: 130,
    ingredientes: [ing('INS-04', 60), ing('INS-05', 20), ing('INS-16', 30), hielo(HIELO_VASO)],
  },
  {
    id: 'REC-21',
    nombre: 'Mezcalita de Jamaica - Jamaica natural',
    padre: 'Mezcalita de Jamaica',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Highball',
    metodo: 'Construido',
    garnitura: 'Flor de jamaica',
    precio: 80,
    ingredientes: [ing('INS-01', 45), ing('INS-18', 60), hielo(HIELO_HIGHBALL)],
  },
  {
    id: 'REC-22',
    nombre: 'Mezcalita de Jamaica - Jamaica con limón',
    padre: 'Mezcalita de Jamaica',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Highball',
    metodo: 'Construido',
    garnitura: 'Rodaja de limón',
    precio: 85,
    ingredientes: [ing('INS-01', 45), ing('INS-18', 60), ing('INS-16', 20), hielo(HIELO_HIGHBALL)],
  },
  {
    id: 'REC-23',
    nombre: 'Mezcalita de Jamaica - Jamaica con canela',
    padre: 'Mezcalita de Jamaica',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Highball',
    metodo: 'Construido',
    garnitura: 'Raja de canela',
    precio: 85,
    ingredientes: [ing('INS-01', 45), ing('INS-18', 60), ing('INS-20', 2), hielo(HIELO_HIGHBALL)],
  },
  {
    id: 'REC-24',
    nombre: 'Mezcalita de Jamaica - Mezcal joven',
    padre: 'Mezcalita de Jamaica',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Highball',
    metodo: 'Construido',
    garnitura: 'Flor de jamaica',
    precio: 90,
    ingredientes: [ing('INS-01', 60), ing('INS-18', 60), hielo(HIELO_HIGHBALL)],
  },
  {
    id: 'REC-25',
    nombre: 'Paloma de Agave - Toronja natural',
    padre: 'Paloma de Agave',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Highball',
    metodo: 'Construido',
    garnitura: 'Gajo de toronja',
    precio: 85,
    ingredientes: [ing('INS-01', 45), ing('INS-17', 90), hielo(HIELO_HIGHBALL)],
  },
  {
    id: 'REC-26',
    nombre: 'Paloma de Agave - Toronja con chile',
    padre: 'Paloma de Agave',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Highball',
    metodo: 'Construido',
    garnitura: 'Escarchado de chile',
    precio: 90,
    ingredientes: [ing('INS-01', 45), ing('INS-17', 90), ing('INS-21', 2), hielo(HIELO_HIGHBALL)],
  },
  {
    id: 'REC-27',
    nombre: 'Paloma de Agave - Mezcal espadín',
    padre: 'Paloma de Agave',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Highball',
    metodo: 'Construido',
    garnitura: 'Gajo de toronja',
    precio: 95,
    ingredientes: [ing('INS-01', 60), ing('INS-17', 90), hielo(HIELO_HIGHBALL)],
  },
  {
    id: 'REC-28',
    nombre: 'Paloma de Agave - Mezcal de pecho',
    padre: 'Paloma de Agave',
    categoriaMenu: 'Coctelería',
    cristaleria: 'Highball',
    metodo: 'Construido',
    garnitura: 'Gajo de toronja',
    precio: 120,
    ingredientes: [ing('INS-03', 60), ing('INS-17', 90), hielo(HIELO_HIGHBALL)],
  },

  // ----------------------------------------------------------- Agua de sol
  {
    id: 'REC-29',
    nombre: 'Agua de sol Jamaica - Vaso 16 oz',
    padre: 'Agua de sol Jamaica',
    categoriaMenu: 'Agua de sol',
    cristaleria: 'Vaso 16 oz',
    metodo: 'Servido',
    garnitura: 'Sin garnitura',
    precio: 45,
    ingredientes: [ing('INS-12', VASO_16_OZ)],
  },
  {
    id: 'REC-30',
    nombre: 'Agua de sol Jamaica - Jarra 1 L',
    padre: 'Agua de sol Jamaica',
    categoriaMenu: 'Agua de sol',
    cristaleria: 'Jarra 1 L',
    metodo: 'Servido',
    garnitura: 'Sin garnitura',
    precio: 80,
    ingredientes: [ing('INS-12', JARRA_1_L)],
  },
  {
    id: 'REC-31',
    nombre: 'Agua de sol Tamarindo - Vaso 16 oz',
    padre: 'Agua de sol Tamarindo',
    categoriaMenu: 'Agua de sol',
    cristaleria: 'Vaso 16 oz',
    metodo: 'Servido',
    garnitura: 'Sin garnitura',
    precio: 45,
    ingredientes: [ing('INS-13', VASO_16_OZ)],
  },
  {
    id: 'REC-32',
    nombre: 'Agua de sol Tamarindo - Jarra 1 L',
    padre: 'Agua de sol Tamarindo',
    categoriaMenu: 'Agua de sol',
    cristaleria: 'Jarra 1 L',
    metodo: 'Servido',
    garnitura: 'Sin garnitura',
    precio: 80,
    ingredientes: [ing('INS-13', JARRA_1_L)],
  },

  // -------------------------------------------------------------- Bebidas
  {
    id: 'REC-33',
    nombre: 'Agua mineral - Botella 355 ml',
    categoriaMenu: 'Bebidas',
    cristaleria: 'Botella',
    metodo: 'Sin preparar',
    garnitura: 'Sin garnitura',
    precio: 30,
    ingredientes: [ing('INS-14', 1)],
  },
  {
    id: 'REC-34',
    nombre: 'Refresco - Lata 355 ml',
    categoriaMenu: 'Bebidas',
    cristaleria: 'Lata',
    metodo: 'Sin preparar',
    garnitura: 'Sin garnitura',
    precio: 35,
    ingredientes: [ing('INS-15', 1)],
  },
]

export const RECETAS: Receta[] = defs.map((d) => ({
  ...d,
  // El catálogo del POS no declara costo de producción: se calcula desde los ingredientes.
  costoDoc: 0,
}))

/** Lo que se prepara en barra, separado de lo que solo se sirve tal cual. */
export const COCTELES = RECETAS.filter((r) => r.categoriaMenu === 'Coctelería')

/** Destilado servido derecho. Lo que antes llamábamos copeo. */
export const TRAGOS = RECETAS.filter((r) => r.nombre.includes('Trago'))
