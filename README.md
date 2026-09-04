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
npm run check      # tests del dominio (vitest)
npm run build      # build de producción + service worker
npm run preview    # sirve el build (única forma de probar la PWA)
```

## Qué hay

| Pantalla | Qué hace |
| --- | --- |
| Dashboard | Valor del inventario, bajo mínimo, lotes por caducar, consumo y merma por costo |
| Inventario | Existencia por insumo, separando botella cerrada de botella de copeo |
| Lotes y marbetes | Una partida por botella, con marbete y caducidad. Abrir botella (cerrada → copeo) |
| Movimientos | Kardex completo. Alta manual de salida, ajuste y merma (por cantidad o por %) |
| Conteo físico | Corte contra existencia física; al cerrar genera los ajustes por diferencia |
| Insumos | Catálogo y costeo. El costo unitario se deriva de la presentación de compra |
| Recetas | BOM de los 18 cócteles, con costo calculado, costo del recetario y margen |
| Compras | Requisición, recepción de mercancía y control de envases prestados (cascos) |
| Proveedores | Alta y edición, con cascos pendientes de devolver |
| Ventas del POS | Tickets recibidos, su explosión a insumos y el descuento al inventario |

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

## Estructura

```
src/
  api/index.ts          capa de datos (hoy en memoria)
  domain/
    types.ts            modelo de datos
    inventario.ts       lógica pura: costeo, existencias, explosión de recetas, PEPS
    inventario.test.ts  los checks de esa lógica
  data/                 semilla: insumos, recetas, lotes, compras, ventas
  hooks.ts              queries y mutaciones de React Query
  ui.tsx                primitivas de UI
  pages/                una por pantalla
  App.tsx               router y layout
```

### La migración al backend

Todos los componentes leen por React Query, y todas las llamadas pasan por `src/api/index.ts`.
Cuando exista backend real, **sólo cambian los cuerpos de esas funciones por `fetch`**: ningún
componente se entera, y el caché, los estados de carga y los de error siguen igual.

La lógica de `src/domain/` es TypeScript puro sin React. Está pensada para moverse tal cual al
backend cuando se defina, así las reglas de inventario no se escriben dos veces.

## Decisiones técnicas

Base: Vite + React + TypeScript + react-router + Tailwind, React Query, react-hook-form + zod,
recharts, vite-plugin-pwa.

Tres desvíos respecto a `docs/libs.md`, todos reversibles:

- **Sin MSW.** Un service worker de más para lo que hoy es una capa de funciones. La ruta de
  migración es la misma y más corta.
- **Sin shadcn/ui ni Radix.** Las primitivas en `src/ui.tsx` usan `<dialog>` y `<select>`
  nativos, que ya traen foco, escape y accesibilidad resueltos. El diseño real viene después,
  con la identidad visual de Cuish; ahí se puede correr `npx shadcn init` encima — las
  primitivas propias viven en `src/ui.tsx` y no estorban `components/ui/`.
- **Sin @tanstack/react-table.** El `DataTable` de `src/ui.tsx` hace orden y filtro en ~60
  líneas, que es todo lo que estas tablas necesitan.

También fuera: `date-fns` (`Intl` cubre `es-MX`) y la cola offline de datos, que es requisito
del POS y no del ERP.

La PWA está desactivada en desarrollo (`devOptions.enabled: false`); sólo se prueba con
`npm run build && npm run preview`.

## Datos: qué es real y qué es inventado

**Real, cargado verbatim de `docs/productos`:** los 34 insumos con su presentación de compra y
costo, y los 18 cócteles con cristalería, método, garnitura, costo declarado y precio.

**Inventado, marcado con `PLACEHOLDER` en el código:**

- Existencias mínimas y máximas — se derivan de la presentación de compra (mín 1.5, máx 6)
  para no inventar 68 números sueltos. Editables por insumo.
- Qué insumos caducan y con qué fecha.
- Las dosis de garnitura: el recetario las describe en texto ("gajo de naranja") sin cantidad.
- Proveedores, lotes, marbetes, existencias iniciales, compras, conteos y ventas.
- `piezasPorCaja`: sólo se confirmó cerveza, y cerveza no está en el catálogo.

## Hallazgos para el gerente

Cosas que salieron al cargar los datos y necesitan respuesta del cliente, no cambio de código:

1. **Dos recetarios que no coinciden** entre sí (cambian dosis e incluso ingredientes base:
   Martini Sucio pasa de ginebra a vodka). Está cargado el de `docs/productos`. Falta confirmar
   cuál es el vigente.
2. **Sbagliato**: el recetario declara $43.35 de costo, pero sus propias dosis dan $48.91
   (13% de desvío). **Centella**: cobra ~$7.70 de garnitura que no dosifica. Los otros 16
   cócteles cuadran dentro del 2%. La pantalla de Recetas marca las desviaciones y el test
   `src/domain/inventario.test.ts` las deja fijadas.
3. **La cerveza no existe en el catálogo de 34 insumos**, pero los cascos y la compra por caja
   de 24 del contexto son sobre cerveza. Compras controla cascos, pero sin el insumo no hay
   qué recibir.

Siguen abiertos, de `docs/context.md`: onzas exactas por caballito y por mezcalina, qué
productos caducan de verdad, qué más viene por caja, quién autoriza una requisición y si hay
tope de monto, y cómo se controla el préstamo de envase.

## Lo que no está

- Backend, persistencia y autenticación real.
- Un solo rol con acceso total. Sin pantalla de usuarios y permisos: se filtran los roles
  cuando el cliente confirme si los necesita.
- Cola offline de datos (es del POS).
- Todo lo fiscal: facturación, CFDI, timbrado, contabilidad. Fuera de alcance por definición.
- Diseño visual definitivo. Lo de hoy es deliberadamente neutro.
- Responsive móvil. Es desktop-first: hay un solo equipo en el negocio.
