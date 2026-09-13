# CLAUDE.md

Contexto para trabajar en este repo. Léelo antes de tocar código.

## Qué es esto

ERP de inventario para **Cuish**, mezcalería y coctelería en Oaxaca. Solo el área de bar:
tragos, cócteles y mezcal en copeo. Sin alimentos, sin nada fiscal.

**El POS es otro repositorio, de otro miembro del equipo.** Este repo es solo el ERP. Los dos
comparten una base Postgres cuyo esquema vive en `docs/db.sql`. Dónde se hospeda esa
instancia todavía se está decidiendo; el esquema es el contrato y no depende de eso.

Hoy el frontend corre contra un **servidor falso en memoria** (`src/shared/api/db.ts`). No hay
backend todavía. El estado se reinicia al recargar la página.

## Antes de escribir código

Lee los documentos de `docs/`. No están de adorno: casi toda decisión rara del código sale de
ahí.

| Documento                                         | Qué resuelve                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `docs/context.md`                                 | Contexto de negocio, restricciones del cliente, pendientes sin respuesta              |
| `docs/db.sql`                                     | Esquema Postgres compartido con el POS. Es el contrato                                |
| `docs/Requisitos del ERP por Módulo — Cuish *.md` | Requisitos con folio (RF-ERP-xx, RF-INT-xx)                                           |
| `docs/productos`                                  | Costeo inicial del cliente. **Ya no es la semilla**: el catálogo se alineó al del POS |
| `docs/roles.md`                                   | Roles del negocio (hoy el sistema solo implementa uno)                                |
| `docs/libs.md`                                    | Librerías decididas al arrancar. Ver "Desvíos" abajo                                  |

Cuando toques una regla con folio, cítalo en el comentario: `// RF-ERP-09`. Así se rastrea
qué código cumple qué requisito.

## Arquitectura: Feature-Sliced Design

Las capas van de arriba hacia abajo. **Una capa solo importa de las que están debajo.**

```
app        composición: router, providers, layout, punto de entrada
pages      una rebanada por ruta
widgets    bloques compuestos que reusan varias pantallas
features   acciones del usuario que cambian estado (verbo: recibir-mercancia, aplicar-venta)
entities   modelo de negocio y acceso a datos, una rebanada por entidad (sustantivo)
shared     sin dominio: primitivas de UI, formato, cliente de datos, contratos
```

Reglas que **hace cumplir el linter**, no la buena voluntad:

- Nadie importa hacia arriba ni de otra rebanada de su misma capa.
- Una rebanada solo se toca por su `index.ts`. Excepción: `shared`, que se importa por
  segmento (`@/shared/ui`, `@/shared/api/db`).
- Si `eslint` te reclama una frontera, **la respuesta casi nunca es apagar la regla**. Suele
  significar que la lógica está en la capa equivocada.

Dentro de una rebanada, los segmentos son archivos, no carpetas: `model.ts` (lógica pura),
`api.ts` (datos y hooks), `ui.tsx` (componentes), `index.ts` (API pública).

### Dónde va cada cosa

- Lógica que toca **una sola entidad** → `entities/<entidad>/model.ts`.
- Lógica que **cruza entidades** → `features/<accion>/model.ts`. Es la razón de que
  `explotarVenta` viva en `features/aplicar-venta` y no en `entities/venta`.
- Si dos features necesitan la misma escritura, **no la dupliques ni la subas a `shared`**:
  una sola feature es la dueña. Por eso `recibir-mercancia` expone tanto la recepción libre
  como `recibirCompra`, y la pantalla de Compras la importa de ahí.
- Alias de importación: `@/` apunta a `src/`. No uses rutas relativas que salgan de la
  rebanada.

## Reglas de negocio que no son obvias

Estas se rompen fácil si no se conocen:

- **Botella cerrada y botella de copeo son partidas distintas** del mismo producto
  (RF-ERP-09). Solo se consume de las abiertas.
- **El consumo es PEPS**: primero el lote abierto más viejo.
- **El inventario se descuenta al cerrar la cuenta**, no al capturar cada consumo
  (RF-ERP-11). Sale de que el mesero levanta la comanda en papel y la captura completa al
  cobrar. Ese proceso del negocio no se cambia.
- **Vender sin existencia alerta pero NO bloquea** (RF-ERP-13). El lote queda en negativo y
  ese negativo tiene que seguir viéndose en el total: si se escondiera, el faltante
  desaparecería del inventario en silencio.
- **El costo unitario nunca se captura**: siempre se deriva de la presentación de compra.
- **Aplicar una venta es idempotente** por id (RF-INT-02). El POS puede reenviar.
- **Un cóctel descuenta de varias partidas a la vez** (BOM, RF-ERP-08).

## Comandos

```bash
npm run dev            # servidor de desarrollo
npm run check          # typecheck + lint + formato + tests. Esto es lo que hay que pasar
npm run test:watch     # tests en watch
npm run test:coverage  # con umbrales; el pipeline falla si bajan
npm run lint:fix       # arregla lo que se pueda solo
```

Hooks de git (husky), no los brinques:

- `pre-commit`: lint-staged (eslint + prettier sobre lo que se va a commitear).
- `commit-msg`: commitlint. **Conventional Commits obligatorios.**
- `pre-push`: typecheck + tests.

Formato de commit: `tipo(scope): descripción`. El scope conviene que sea la rebanada de FSD:
`feat(entities/lote):`, `fix(features/aplicar-venta):`, `test(shared/ui):`.

## Pruebas

`vitest` + `@testing-library/react` + jsdom. 248 pruebas.

- `resetDb()` corre antes de cada prueba: siempre se parte de la misma semilla.
- Componentes: `renderConProviders` de `@/shared/test/render` (QueryClient + router).
- Consulta por **rol y texto accesible**, no por clase ni por `data-testid`.
- El `<dialog>` nativo y `ResizeObserver` están parchados en `src/shared/test/setup.ts`
  porque jsdom no los trae.
- Las pruebas pueden saltarse las fronteras de FSD (están exentas en el linter).

Cuando escribas una prueba, que falle por una razón de negocio, no por un detalle de
maquetado. El nombre de la prueba debe decir qué regla protege.

## Datos: qué es real y qué es inventado

**El catálogo sale de la base compartida** (proyecto `dbcuish`), no del documento de costeo
inicial. Nombres, precios, variantes y categorías de menú son del POS y no se inventan ni se
cambian. Lo que el POS no modela y este repo sí: qué producto es insumo, la unidad real,
control por lote, caducidad, el BOM y los costos.

Confirmado con el cliente (ya aplicado, no lo vuelvas a preguntar):

- Caduca todo **menos el alcohol**. Se deriva de la categoría en `seed/insumos.ts`.
- El tamaño de la caja lo define el proveedor al comprar; el catálogo solo sugiere.
- La requisición la autoriza el usuario del ERP que la crea, y guarda su nombre.
- Las bebidas se miden en **onzas**. La carta del POS vende el derecho como "Trago 2 oz"
  (`TRAGO_OZ`), y el copeo se modela como receta de un solo ingrediente.

Inventado y marcado con `PLACEHOLDER`: **todos los costos de compra** y **todas las dosis de
las recetas**, más mínimos y máximos, proveedores, lotes, marbetes, existencias iniciales,
compras, conteos y ventas. **No los presentes como reales.**

## Pendientes abiertos con el cliente

Cinco, en orden de gravedad:

1. **El POS y el ERP modelan negocios distintos.** Es el punto 1.1 de `docs/dudas.md` y es el
   más grave: la base lleva todo por pieza y sin lotes, el alcance del ERP asume lote y
   mililitro. Hasta cerrarlo, la API se construye sobre arena.
2. **Cuánto sirve un trago.** La carta dice 2 oz, el cliente dijo 45 ml.
3. **Las dosis de cada receta**, con el barman.
4. **Los costos de compra reales**, con una factura.
5. **Mínimos y máximos reales.** Hoy derivados de la presentación (1.5 / 6).

Si algo del negocio no está definido, **no lo inventes en silencio**: déjalo como
`PLACEHOLDER` con comentario, o como aviso visible en la pantalla.

## Desvíos respecto a `docs/libs.md`

Documentados y reversibles. Si los vas a revertir, que sea por una razón, no por inercia:

- **Sin MSW.** La capa de datos ya está aislada en `entities/*/api.ts`; un service worker
  extra no compra nada y pelea con la PWA.
- **Sin shadcn/ui ni Radix.** Las primitivas de `shared/ui` usan `<dialog>` y `<select>`
  nativos. El diseño real llega después con la identidad visual de Cuish.
- **Sin `@tanstack/react-table`.** `shared/ui/data-table.tsx` hace orden y filtro en ~60
  líneas, que es todo lo que estas tablas necesitan.
- **Sin `date-fns`.** `Intl` cubre `es-MX`.

## Estilo

- Todo en español: código, comentarios, commits, UI. Moneda MXN, formato `es-MX`.
- Comentarios que expliquen **por qué**, no qué. Si un comentario repite el código, bórralo.
- Marca las simplificaciones deliberadas con `// ponytail:` y nombra el techo y la salida.
- Prefiere la plataforma antes que una dependencia: `<dialog>`, `<select>`, `Intl`,
  `structuredClone`.
- No agregues una abstracción con un solo uso.
