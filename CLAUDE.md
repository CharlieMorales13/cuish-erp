# CLAUDE.md

Contexto para trabajar en este repo. Léelo antes de tocar código.

## Qué es esto

ERP de inventario para **Cuish**, mezcalería y coctelería en Oaxaca. Solo el área de bar:
tragos, cócteles y mezcal en copeo. Sin alimentos, sin nada fiscal.

**El POS es otro repositorio, de otro miembro del equipo.** Este repo es solo el ERP. Los dos
comparten una base Postgres (Supabase) cuyo esquema vive en `docs/db.sql`.

Hoy el frontend corre contra un **servidor falso en memoria** (`src/shared/api/db.ts`). No hay
backend todavía. El estado se reinicia al recargar la página.

## Antes de escribir código

Lee los documentos de `docs/`. No están de adorno: casi toda decisión rara del código sale de
ahí.

| Documento                                         | Qué resuelve                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `docs/context.md`                                 | Contexto de negocio, restricciones del cliente, pendientes sin respuesta |
| `docs/db.sql`                                     | Esquema Postgres compartido con el POS. Es el contrato                   |
| `docs/Requisitos del ERP por Módulo — Cuish *.md` | Requisitos con folio (RF-ERP-xx, RF-INT-xx)                              |
| `docs/productos`                                  | Los 34 insumos costeados y las 18 recetas. Fuente de la semilla          |
| `docs/roles.md`                                   | Roles del negocio (hoy el sistema solo implementa uno)                   |
| `docs/libs.md`                                    | Librerías decididas al arrancar. Ver "Desvíos" abajo                     |

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

`vitest` + `@testing-library/react` + jsdom. 223 pruebas.

- `resetDb()` corre antes de cada prueba: siempre se parte de la misma semilla.
- Componentes: `renderConProviders` de `@/shared/test/render` (QueryClient + router).
- Consulta por **rol y texto accesible**, no por clase ni por `data-testid`.
- El `<dialog>` nativo y `ResizeObserver` están parchados en `src/shared/test/setup.ts`
  porque jsdom no los trae.
- Las pruebas pueden saltarse las fronteras de FSD (están exentas en el linter).

Cuando escribas una prueba, que falle por una razón de negocio, no por un detalle de
maquetado. El nombre de la prueba debe decir qué regla protege.

## Datos: qué es real y qué es inventado

Real, verbatim de `docs/productos`: los 34 insumos con presentación y costo, y las 18 recetas
con cristalería, método, garnitura, costo declarado y precio.

Inventado y marcado con `PLACEHOLDER` en el código: mínimos y máximos, qué caduca, dosis de
garnitura, proveedores, lotes, marbetes, existencias iniciales, compras, conteos y ventas.
**No los presentes como reales.**

## Hallazgos abiertos con el cliente

Están en el README y en `docs/context.md`. Los tres que más pegan al código:

1. Hay **dos recetarios que no coinciden**; está cargado el de `docs/productos`.
2. **Centella** y **Sbagliato** tienen costo declarado que no cuadra con sus propias dosis.
   El test `entities/receta/model.test.ts` deja esa lista fijada: si el gerente corrige una,
   el test te avisa.
3. **La cerveza no existe en el catálogo de 34 insumos**, pero los cascos y la compra por caja
   de 24 son sobre cerveza.

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
