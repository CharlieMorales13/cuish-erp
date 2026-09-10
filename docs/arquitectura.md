# Arquitectura técnica — Cuish ERP

Subsistema ERP de inventario. Documento vivo; se actualiza cuando cambia una decisión, no
cuando cambia el código.

---

## Resumen ejecutivo

### Frontend

- **React 18 + Vite 6 + TypeScript** en modo `strict`, con `noUnusedLocals` y
  `noUnusedParameters`
- **Feature-Sliced Design** (`app / pages / widgets / features / entities / shared`) como
  patrón de arquitectura, con las fronteras entre capas **verificadas por el linter** en cada
  commit — no como convención documentada
- **Tailwind CSS 4** y una librería de primitivas propia sobre elementos nativos
  (`<dialog>`, `<select>`), sin dependencias de UI de terceros
- **React Query** para todo el estado de servidor: caché, reintentos, invalidación
- **React Hook Form + Zod** en formularios; el mismo esquema Zod se reutilizará en la API
- **PWA instalable** (`vite-plugin-pwa`), con precache del shell de la aplicación

### Datos y sincronización

- Capa de datos aislada tras las entidades: hoy resuelve contra un **servidor falso en
  memoria**, mañana contra HTTP, **sin tocar ni un componente**
- **Base Postgres (Supabase) compartida con el POS**; el esquema (`docs/db.sql`) es el
  contrato entre los dos sistemas
- El **UUID de la venta lo genera el POS** al capturar; el ERP lo trata como llave de
  idempotencia: reenviar una venta no descuenta inventario dos veces
- El descuento de inventario se dispara **al cerrar la cuenta**, no al capturar cada consumo
- Explosión de recetas tipo **BOM**: una venta descuenta de varias partidas a la vez, con
  asignación **PEPS** entre lotes

### Herramientas de desarrollo

- **Vitest + Testing Library + jsdom**: **223 pruebas** entre lógica de dominio, integración
  de features y componentes de UI
- **Cobertura con umbrales que rompen el pipeline**: 90.8% de sentencias, 91.3% de ramas
- **ESLint 9 (flat config) + `eslint-plugin-boundaries`**: reglas que hacen cumplir las capas
  de FSD y el acceso por API pública de cada rebanada
- **Prettier**, **Husky**, **lint-staged** y **commitlint** con **Conventional Commits**
- Hooks de git: `pre-commit` (lint + formato), `commit-msg` (convención), `pre-push`
  (typecheck + suite completa)

---

## Feature-Sliced Design

### Las capas

```
app        composición: router, providers, layout, punto de entrada
pages      una rebanada por ruta (11 pantallas)
widgets    bloques compuestos que reusan varias pantallas
features   acciones que cambian estado — nombre en verbo
entities   modelo de negocio y acceso a datos — nombre en sustantivo
shared     sin dominio: primitivas de UI, formato, cliente de datos, contratos
```

Una capa solo importa de las que están debajo. Una rebanada nunca importa de otra rebanada de
su misma capa. Una rebanada solo se toca por su `index.ts`.

### Por qué FSD y no capas propias

Una arquitectura "en capas dominio/aplicación/infraestructura" resuelve la dirección de las
dependencias, pero no dice **dónde vive una funcionalidad**. Con módulos por área funcional
(`catálogo`, `venta`, `caja`) el problema aparece cuando algo cruza dos módulos: acaba en el
que lo pidió primero, o en un `common/` que crece sin control.

FSD parte por **capa y por rebanada**, y la regla de "una rebanada no importa a su vecina"
obliga a resolver esos cruces de forma explícita. Ejemplo real de este repo: aplicar una venta
toca `venta`, `receta`, `lote` y `movimiento`. Con módulos funcionales, esa lógica cae en el
módulo de venta y arrastra a los otros tres. Con FSD no puede: las entidades no se ven entre
sí, así que la orquestación **tiene que** vivir en `features/aplicar-venta`, que es donde
conceptualmente pertenece.

El otro cruce típico: dar de alta lotes al recibir mercancía es exactamente la misma
transacción venga de una recepción libre o de una compra. La regla prohíbe que una feature
importe a otra, y eso empuja a la única solución sana — **una sola dueña**
(`features/recibir-mercancia`, que expone las dos entradas) en vez de dos copias que se
separan con el tiempo.

### La arquitectura la verifica el linter

`eslint.config.js` deriva las políticas del orden de las capas:

```js
const CAPAS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

'boundaries/dependencies': ['error', {
  default: 'disallow',
  policies: CAPAS.map((capa) => ({
    from: [{ element: { type: capa } }],
    allow: [mismaRebanada(capa), ...capasDebajo(capa).map(porApiPublica)],
  })),
}]
```

No hay lista de excepciones que mantener: agregar una capa es editar un arreglo. Y como
`pre-commit` corre el linter, **una violación de arquitectura no llega al repositorio**.

### Anatomía de una rebanada

Los segmentos son archivos, no carpetas:

```
entities/lote/
  model.ts    lógica pura: existencia, consumo PEPS, afectación de lote
  api.ts      lectura, hooks de React Query, escritura síncrona para features
  ui.tsx      componentes propios de la entidad
  index.ts    API pública — lo único que el resto puede importar
```

---

## La capa de datos y la migración a la API real

Hoy `src/shared/api/db.ts` es un servidor falso: mantiene las tablas en memoria y simula la
latencia de red. **Es la única pieza del proyecto que sabe que todavía no hay backend.**

```
componente  →  hook de React Query  →  entities/<x>/api.ts  →  shared/api/db.ts
                                                               (mañana: fetch)
```

Cuando exista la API, cambian los cuerpos de las funciones de `entities/*/api.ts` y
`contracts.ts` pasa a generarse desde el esquema. **Ningún componente, feature o pantalla se
entera**: el caché, los estados de carga y los de error siguen igual porque los maneja React
Query, no las pantallas.

La lógica de negocio de `entities/*/model.ts` y `features/*/model.ts` es TypeScript puro sin
React. Está escrita para **moverse tal cual al backend** cuando se defina, de modo que las
reglas de inventario no se escriban dos veces. Lo mismo con los esquemas Zod: validan el
formulario hoy y validarán el request mañana.

---

## Contrato de datos: frontend ↔ `docs/db.sql`

El esquema Postgres es compartido con el POS. El modelo del frontend **todavía no está
alineado con él**: se construyó antes de tener el esquema. Esta tabla es el trabajo pendiente
de alineación, y es el insumo directo para diseñar la API.

| Tipo en el frontend | Tabla en `db.sql` | Estado |
| --- | --- | --- |
| `Insumo` | `producto` (`es_insumo = true`) | **Divergente**: hay que unificar |
| `Receta` | `producto` (`es_vendible`) + `receta` + `receta_ingrediente` | **Divergente** |
| `Lote` | `lote` | **Divergente** en `restante` |
| `Movimiento` | `movimiento_inventario` | Alineable |
| `Proveedor` | `proveedor` | Alineado |
| `Compra` / `LineaCompra` | `compra` / `compra_linea` | Alineable |
| `Venta` / `LineaVenta` | `venta` / `venta_linea` | Alineable |
| `Conteo` | — | **No existe en el esquema** |
| — | `usuario`, `turno_caja`, `cuenta`, `venta_pago`, `categoria_menu` | Del POS; el ERP los lee |

### Divergencias que hay que resolver antes de construir la API

1. **`producto` unifica insumo y cóctel.** El frontend los tiene como dos tipos separados. En
   el esquema son un solo `producto` con banderas `es_insumo` / `es_vendible`, un `tipo`, y
   `producto_padre_id` para las variantes. Es el cambio más grande.

2. **Un producto tiene N presentaciones de compra.** El frontend asume una
   (`Insumo.presentacion`). El esquema tiene `producto_presentacion_compra`, que además
   resuelve mejor el "compra por caja de 24, vende por pieza" (RF-ERP-07) que la bandera
   `piezasPorCaja` que hay hoy.

3. **El costo no vive en el catálogo.** El frontend guarda `costoCompra` y `costoUnitario` en
   el insumo. En el esquema el costo es histórico y vive en `compra_linea.costo_unitario`.
   Esto cambia el costeo de recetas: pasa de "costo actual del catálogo" a una política
   explícita (último costo, costo promedio o PEPS). **Hay que decidir cuál.**

4. **La existencia se deriva, no se guarda.** `lote` no tiene columna de restante: el saldo
   sale de sumar `movimiento_inventario`. El frontend hoy guarda `Lote.restante`. La versión
   con backend debe calcular el saldo (vista materializada o agregación), y `movimiento_inventario`
   se vuelve la única fuente de verdad. **Esto es lo correcto** y conviene adoptarlo.

5. **`receta` está versionada** (`version`, `activa`, `vigente_desde`). El frontend no lo
   contempla. **Esto resuelve por diseño el problema de los dos recetarios que no coinciden**:
   se cargan como dos versiones y el gerente activa la vigente, sin perder la otra.

6. **`movimiento_inventario` referencia de forma polimórfica** (`referencia_tipo` +
   `referencia_id`). El frontend usa un `ref` de texto libre. Cambio menor pero real.

7. **`cuenta` es una entidad**, con `tipo_atencion` y `estado`. El frontend guarda el nombre
   de la cuenta como texto en la venta.

8. **El conteo físico no existe en el esquema.** RF-ERP-01 pide cortes contra existencia
   física. Faltan `conteo` y `conteo_linea`, o la decisión explícita de resolverlo solo con
   movimientos de ajuste.

9. **El préstamo de envases (cascos) no existe en el esquema.** Es un control que salió del
   ticket de Modelo y no estaba en los requisitos originales. Está implementado en el
   frontend y no tiene dónde persistir.

10. **`venta.uuid_cliente UNIQUE` confirma el diseño de idempotencia** (RF-INT-01 / RF-INT-02):
    el POS genera el UUID al capturar y el `folio bigint` lo asigna el servidor. El frontend
    ya lo trata así.

---

## Reglas de negocio implementadas

| Regla | Requisito | Dónde vive |
| --- | --- | --- |
| Botella cerrada y de copeo son partidas distintas | RF-ERP-09 | `entities/lote/model.ts` |
| Consumo PEPS entre lotes abiertos | — | `entities/lote/model.ts` |
| Explosión de receta tipo BOM | RF-ERP-08 | `features/aplicar-venta/model.ts` |
| Descuento al cerrar la cuenta, no al capturar | RF-ERP-11 | `features/aplicar-venta/api.ts` |
| Alerta de existencia en cero sin bloquear | RF-ERP-13 | `features/aplicar-venta/api.ts` |
| Idempotencia por id de venta | RF-INT-02 | `features/aplicar-venta/api.ts` |
| Conversión de unidades por producto | RF-ERP-07 | `features/recibir-mercancia/model.ts` |
| Entradas, salidas y ajustes | RF-ERP-02 | `features/registrar-movimiento/api.ts` |
| Merma expresada como porcentaje | RF-ERP-03 | `entities/movimiento/model.ts` |
| Existencias mínimas y máximas | RF-ERP-04 | `entities/insumo/model.ts` |
| Inventario inicial y cortes físicos | RF-ERP-01 | `features/capturar-conteo/api.ts` |
| Lote y caducidad por producto | RF-ERP-05, RF-ERP-06 | `entities/lote`, `shared/lib/fechas.ts` |
| Marbete por botella | RF-ERP-12 | `features/recibir-mercancia/model.ts` |
| Almacén único | RF-ERP-10 | Por diseño: no hay concepto de almacén |

---

## Estrategia de pruebas

223 pruebas en tres niveles, con umbrales de cobertura que rompen el build si bajan.

| Nivel | Qué prueba | Ejemplo |
| --- | --- | --- |
| Dominio | Funciones puras, sin React ni red | PEPS agota el lote viejo antes del nuevo |
| Integración | Features contra el servidor falso | Aplicar una venta descuenta y es idempotente |
| Componentes | Pantallas y formularios como los usa una persona | Cerrar el conteo ajusta la existencia |

Las pruebas se consultan **por rol y texto accesible**, nunca por clase CSS ni `data-testid`.
Efecto lateral buscado: si un cambio rompe la accesibilidad, rompe las pruebas.

### Lo que las pruebas encontraron

No son decorativas. Al escribirlas salieron cuatro defectos reales:

1. **`Input`, `Select` y `Textarea` no reenviaban `ref`.** React Hook Form entrega una `ref`
   en `register()`; sin `forwardRef` React la descarta en silencio. El formulario de insumos
   se veía bien pero **nunca precargaba ni validaba de verdad**. Hoy hay un test de regresión
   que lo fija.
2. **`sembrarVentasAplicadas` no era idempotente.** Re-aplicaba el inventario si el módulo se
   volvía a evaluar (un hot-reload bastaba).
3. **`existencia()` descartaba los lotes agotados**, así que un lote que quedaba en negativo
   por una venta sin existencia **hacía desaparecer el faltante del inventario**.
4. **`diasParaCaducar` mutaba la fecha que recibía** (`setHours` sobre el argumento).

Además, el costeo de recetas dejó fijados dos hallazgos de negocio: **Centella** y
**Sbagliato** declaran en el recetario un costo que no cuadra con sus propias dosis. Si el
gerente corrige alguna, el test avisa.

---

## Calidad y flujo de trabajo

| Puerta | Cuándo corre | Qué revisa |
| --- | --- | --- |
| `lint-staged` | `pre-commit` | ESLint (incluidas fronteras FSD) + Prettier |
| `commitlint` | `commit-msg` | Conventional Commits |
| `typecheck` + `vitest` | `pre-push` | Tipos y suite completa |
| `npm run check` | Manual / CI | Las cuatro cosas juntas |

Convención de commit: `tipo(scope): descripción`, con el scope apuntando a la rebanada de FSD
(`feat(entities/lote):`, `fix(features/aplicar-venta):`).

---

## Decisiones y desvíos

Respecto a las librerías decididas al arranque (`docs/libs.md`):

| Decisión original | Qué se hizo | Por qué |
| --- | --- | --- |
| MSW para mocks | Capa de datos propia | La capa ya está aislada tras `entities/*/api.ts`; un service worker extra no compra nada y pelea con la PWA |
| shadcn/ui + Radix | Primitivas propias | `<dialog>` y `<select>` nativos ya traen foco, escape y accesibilidad. El diseño real llega después con la identidad visual |
| `@tanstack/react-table` | `DataTable` propia | ~60 líneas cubren orden y filtro, que es todo lo que estas tablas necesitan |
| `date-fns` | `Intl` | Cubre `es-MX` sin dependencia |

Todos son reversibles y están documentados en `CLAUDE.md`.

---

## Lo que no está

- Backend, persistencia y autenticación real
- Alineación del modelo con `docs/db.sql` (ver la tabla de divergencias)
- Un solo rol con acceso total; sin pantalla de usuarios y permisos
- Cola offline de datos — es requisito del POS, no del ERP
- Todo lo fiscal: facturación, CFDI, timbrado, contabilidad
- Diseño visual definitivo
- Responsive móvil: es desktop-first porque hay un solo equipo en el negocio
