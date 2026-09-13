# Cuish ERP

Subsistema ERP de inventario para **Cuish**, mezcalería y coctelería en Oaxaca. Cubre
únicamente el área de bar: tragos, cócteles y mezcal en copeo. Sin alimentos, sin nada fiscal.

Estado: **frontend-first**. Todas las pantallas funcionan, pero los datos viven en memoria
del navegador. No hay backend todavía.

El POS es un proyecto aparte, en otro repositorio y a cargo de otro miembro del equipo. Aquí
sólo está el lado ERP de la integración: la pantalla de ventas recibidas y el descuento de
inventario al cerrar la cuenta.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:5173
```

El login es falso: cualquier usuario entra. Todo el estado se reinicia al recargar la página.

```bash
npm run check          # typecheck + lint + formato + tests. Esto es lo que hay que pasar
npm run test           # 284 pruebas (vitest)
npm run test:coverage  # con umbrales; falla si la cobertura baja
npm run build          # build de producción + service worker
npm run preview        # sirve el build (única forma de probar la PWA)
```

Hooks de git (husky): `pre-commit` corre lint y formato, `commit-msg` exige Conventional
Commits, `pre-push` corre typecheck y la suite completa. Y GitHub Actions repite todo en cada
pull request, porque los hooks se brincan con `--no-verify`.

## Qué hay

| Pantalla         | Qué hace                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Dashboard        | Valor del inventario, bajo mínimo, lotes por caducar, consumo y merma por costo   |
| Inventario       | Existencia por insumo, separando botella cerrada de botella de copeo              |
| Lotes y marbetes | Una partida por botella, con marbete y caducidad. Abrir botella (cerrada → copeo) |
| Movimientos      | Kardex completo. Alta manual de salida, ajuste y merma (por cantidad o por %)     |
| Conteo físico    | Corte contra existencia física; al cerrar genera los ajustes por diferencia       |
| Insumos          | Catálogo y costeo. El costo unitario se deriva de la presentación de compra       |
| Recetas          | BOM de los 34 productos vendibles de la carta, con costo calculado y margen       |
| Compras          | Requisición, recepción de mercancía y control de envases prestados (cascos)       |
| Proveedores      | Alta y edición, con cascos pendientes de devolver                                 |
| Ventas del POS   | Tickets recibidos, su explosión a insumos y el descuento al inventario            |

### Cómo se modela el inventario

- **Un solo almacén.** No hay ubicaciones ni traspasos.
- **Cada botella es un lote.** Una botella sellada y una abierta para copeo son partidas
  distintas del mismo producto (RF-ERP-09). Sólo las abiertas se consumen.
- **PEPS.** El consumo toma primero el lote abierto más viejo.
- **El descuento ocurre al cerrar la cuenta**, no al capturar cada consumo (RF-ERP-11). Es
  la consecuencia directa de que el mesero levanta la comanda en papel y la captura completa
  al cobrar. Ese proceso no se cambia.
- **Vender sin existencia alerta pero no bloquea** (RF-ERP-13). El lote queda en negativo y
  el faltante se sigue viendo en el total, hasta que un conteo físico lo resuelva.

## Estructura: Feature-Sliced Design

```
src/
  app/        composición: router, providers, layout, punto de entrada
  pages/      una rebanada por ruta (11 pantallas)
  widgets/    bloques compuestos que reusan varias pantallas
  features/   acciones que cambian estado (recibir-mercancia, aplicar-venta, …)
  entities/   modelo de negocio y datos (insumo, lote, receta, movimiento, …)
  shared/     sin dominio: primitivas de UI, formato, cliente de datos, contratos
```

Una capa solo importa de las que están debajo, nunca de otra rebanada de su misma capa, y
siempre por el `index.ts` de la rebanada. **Esas reglas las hace cumplir ESLint**
(`eslint-plugin-boundaries`) y el linter corre en el `pre-commit`, así que una violación de
arquitectura no llega al repositorio.

Detalle completo en [`docs/arquitectura.md`](docs/arquitectura.md) y en `CLAUDE.md`.

### La migración al backend

Todos los componentes leen por React Query, y todas las llamadas pasan por
`entities/*/api.ts`. El único archivo que sabe que hoy no hay backend es
`src/shared/api/db.ts`. Cuando exista la API, **sólo cambian los cuerpos de esas funciones por
`fetch`**: ningún componente se entera, y el caché, los estados de carga y los de error siguen
igual.

La lógica de `entities/*/model.ts` y `features/*/model.ts` es TypeScript puro sin React. Está
pensada para moverse tal cual al backend cuando se defina, así las reglas de inventario no se
escriben dos veces. Lo mismo con los esquemas Zod: validan el formulario hoy y el request
mañana.

La base Postgres se comparte con el POS y su esquema está en
[`docs/db.sql`](docs/db.sql). El modelo del frontend **todavía no está alineado con él**: la
tabla de divergencias y lo que hay que decidir antes de construir la API están en
[`docs/arquitectura.md`](docs/arquitectura.md).

## Pruebas

284 pruebas en tres niveles: lógica de dominio (funciones puras), integración de features
contra el servidor falso, y componentes de pantalla con Testing Library. La cobertura tiene
umbrales que rompen el build si bajan (hoy 91.9% de sentencias, 91.6% de ramas).

Las pruebas consultan por rol y texto accesible, nunca por clase CSS ni `data-testid`: si un
cambio rompe la accesibilidad, rompe las pruebas.

## Decisiones técnicas

Base: Vite + React + TypeScript + react-router + Tailwind, React Query, react-hook-form + zod,
recharts, vite-plugin-pwa. Calidad: ESLint 9 con `eslint-plugin-boundaries`, Prettier, Husky,
lint-staged, commitlint, Vitest + Testing Library.

Tres desvíos respecto a `docs/libs.md`, todos reversibles:

- **Sin MSW.** Un service worker de más para lo que hoy es una capa de funciones. La ruta de
  migración es la misma y más corta.
- **Sin shadcn/ui ni Radix.** Las primitivas de `src/shared/ui/` usan `<dialog>` y `<select>`
  nativos, que ya traen foco, escape y accesibilidad resueltos. El diseño real viene después,
  con la identidad visual de Cuish; ahí se puede correr `npx shadcn init` encima — las
  primitivas propias viven en `shared/ui` y no estorban `components/ui/`.
- **Sin @tanstack/react-table.** El `DataTable` de `src/shared/ui/` hace orden y filtro en ~60
  líneas, que es todo lo que estas tablas necesitan.

También fuera: `date-fns` (`Intl` cubre `es-MX`) y la cola offline de datos, que es requisito
del POS y no del ERP.

La PWA está desactivada en desarrollo (`devOptions.enabled: false`); sólo se prueba con
`npm run build && npm run preview`.

## Datos: de dónde sale el catálogo

**El catálogo está alineado a la base compartida** (proyecto `dbcuish`), no al documento de
costeo inicial. Nombres, precios, variantes y categorías de menú salen tal cual del POS: 34
productos vendibles agrupados bajo 10 productos padre.

El POS no modela lo que el ERP necesita, así que esa capa la pone este repo:

| Lo que faltaba en la base                       | Qué se agregó aquí                                                |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Ningún producto marcado como insumo             | 22 insumos: lo que realmente se almacena y se descuenta           |
| Todo en piezas, incluidas botellas de 750 ml    | Unidad real por producto: mililitros para destilados y graneles   |
| `controla_lote` y `controla_caducidad` apagados | Control por lote en destilados y licores; caducidad por categoría |
| Tabla `receta` vacía                            | BOM de los 34 vendibles                                           |
| Sin presentaciones de compra ni costos          | Presentación y costo por insumo                                   |

**Confirmado con el cliente:**

- **Caducidad**: caduca todo **menos el alcohol** (destilados, licores, vinos, cervezas). Se
  deriva de la categoría, no se captura producto por producto.
- **Cajas**: el tamaño lo define el proveedor al comprar. El catálogo sugiere; la pantalla de
  recepción permite corregirlo.
- **Quién autoriza una requisición**: el usuario del ERP que la crea. La compra guarda su
  nombre (`compra.usuario_id` en el esquema compartido).
- **Unidades**: las bebidas se miden en onzas; el inventario se guarda en mililitros y el
  sistema convierte. El esquema compartido acepta `oz`.

**Inventado, marcado con `PLACEHOLDER` en el código:**

- **Todos los costos de compra.** La base compartida no guarda costo en el catálogo y las
  tablas `compra` y `compra_linea` están vacías. Hay que reemplazarlos con una factura real.
- **Todas las dosis de las recetas.** De la carta se deduce _qué_ lleva cada variante, porque
  el nombre lo dice, pero no _cuánto_.
- Existencias mínimas y máximas — derivadas de la presentación de compra (mín 1.5, máx 6).
- Proveedores, lotes, marbetes, existencias iniciales, compras, conteos y ventas.

## Pendientes con el cliente

El grande está en [`docs/dudas.md`](docs/dudas.md), punto 1.1: **el POS y el ERP están
modelando negocios distintos**. La base lleva el inventario por pieza y sin lotes; el alcance
del ERP asume lote, mililitro y caducidad. Eso hay que cerrarlo antes del sprint de la API.

Además:

1. **Cuánto sirve un trago.** La carta del POS lo vende como "Trago 2 oz" (59 ml) y el cliente
   nos dio 45 ml para el caballito. Son dos medidas para el mismo servicio.
2. **Las dosis de cada receta**, con el barman.
3. **Los costos de compra reales**, con una factura.
4. **Existencias mínimas y máximas**, de las que dependen las alertas del dashboard.

## Lo que no está

- Backend, persistencia y autenticación real.
- Un solo rol con acceso total. Sin pantalla de usuarios y permisos: se filtran los roles
  cuando el cliente confirme si los necesita.
- Cola offline de datos (es del POS).
- Todo lo fiscal: facturación, CFDI, timbrado, contabilidad. Fuera de alcance por definición.
- Diseño visual definitivo. Lo de hoy es deliberadamente neutro.
- Responsive móvil. Es desktop-first: hay un solo equipo en el negocio.
