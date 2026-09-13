# Cuish ERP — Arquitectura y estado del proyecto

Subsistema ERP de inventario para Cuish, mezcalería y coctelería en Oaxaca. Integrado con el
POS sobre una base de datos compartida.

---

## 1. Dónde estamos

**El ERP está construido y funcionando de punta a punta.** Once pantallas operativas, el
modelo de inventario del negocio implementado completo, y una base de ingeniería lista para
conectar la API sin reescribir nada del frontend.

| | |
| --- | --- |
| Pantallas operativas | **11** |
| Requisitos funcionales implementados | **15 de 15** del alcance ERP |
| Pruebas automatizadas | **240** |
| Cobertura de código | **91.2%** sentencias · **91.3%** ramas |
| Reglas de arquitectura verificadas por herramienta | **6 capas**, en cada commit |
| Defectos encontrados y corregidos por la suite | **4** |

---

## 2. Stack técnico

### Frontend

- **React 18 + Vite 6 + TypeScript** en modo `strict`, con detección de variables y
  parámetros sin usar
- **Feature-Sliced Design** como patrón de arquitectura, con las fronteras entre capas
  **verificadas automáticamente por el linter** en cada commit — no como convención escrita
- **Tailwind CSS 4** y una librería de componentes propia construida sobre elementos nativos
  del navegador (`<dialog>`, `<select>`), sin dependencias de UI de terceros
- **React Query** para todo el estado de servidor: caché, reintentos e invalidación
- **React Hook Form + Zod** en formularios; el mismo esquema Zod se reutilizará en la API
- **PWA instalable** con precache del shell de la aplicación

### Datos e integración con el POS

- **Base Postgres compartida** entre el POS y el ERP; el esquema es el contrato formal entre
  los dos sistemas, independiente de dónde se hospede la instancia
- Capa de datos **completamente aislada** detrás de las entidades: el frontend ya opera contra
  una implementación intercambiable, y conectar la API real no toca ningún componente
- **Idempotencia garantizada**: el UUID de la venta lo genera el POS al capturar y el ERP lo
  usa como llave; reenviar una venta no descuenta inventario dos veces
- **Explosión de recetas tipo BOM** con asignación **PEPS** entre lotes: una venta descuenta de
  varias partidas a la vez, tomando siempre la más antigua primero

### Ingeniería y calidad

- **Vitest + Testing Library + jsdom**: 240 pruebas en tres niveles
- **Umbrales de cobertura que detienen el build** si la calidad baja
- **ESLint 9** con `eslint-plugin-boundaries`: reglas que hacen cumplir las capas de la
  arquitectura y el acceso por API pública de cada módulo
- **Prettier, Husky, lint-staged y commitlint** con Conventional Commits
- Compuertas automáticas: `pre-commit` (estilo y arquitectura), `commit-msg` (convención de
  mensajes), `pre-push` (tipos y suite completa)

---

## 3. La arquitectura

### Seis capas, dependencias en un solo sentido

```
app        composición: router, providers, layout, punto de entrada
pages      una rebanada por ruta (11 pantallas)
widgets    bloques compuestos que reusan varias pantallas
features   acciones que cambian estado — nombre en verbo
entities   modelo de negocio y acceso a datos — nombre en sustantivo
shared     sin dominio: componentes, formato, cliente de datos, contratos
```

Una capa solo importa de las que están debajo. Una rebanada nunca importa de su vecina. Cada
módulo se consume únicamente por su API pública.

### Por qué esto importa en este proyecto

Un ERP de inventario está hecho de operaciones que **cruzan varias entidades a la vez**.
Cerrar una cuenta toca venta, receta, lote y movimiento en la misma transacción. Es
exactamente el tipo de lógica que, sin una regla que lo impida, termina desparramada.

FSD lo resuelve por construcción: las entidades **no pueden verse entre sí**, así que la
orquestación tiene que vivir en una feature con nombre propio. El resultado es que cada regla
de negocio tiene una y solo una dirección conocida en el código:

| Regla de negocio | Dónde vive |
| --- | --- |
| Cerrar la cuenta descuenta el inventario | `features/aplicar-venta` |
| Recibir mercancía crea las partidas | `features/recibir-mercancia` |
| Abrir una botella la pasa a copeo | `features/abrir-botella` |
| Contar físico y ajustar diferencias | `features/capturar-conteo` |
| Existencia, PEPS y afectación de lote | `entities/lote` |
| Costeo de recetas y margen | `entities/receta` |

El mismo principio evitó una duplicación clásica: dar de alta lotes al recibir mercancía es la
misma transacción venga de una recepción directa o de una compra. La regla de arquitectura
prohíbe que una feature importe a otra, lo que empuja a la solución correcta — **una sola
dueña** que expone las dos entradas, en vez de dos copias que se separan con el tiempo.

### La arquitectura se verifica sola

Las políticas de dependencia se derivan del orden de las capas:

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

No hay lista de excepciones que mantener: agregar una capa es editar un arreglo. Y como el
linter corre en el `pre-commit`, **una violación de arquitectura no llega al repositorio**.

---

## 4. El modelo de inventario del negocio

Lo que hace este ERP distinto de un inventario genérico es que modela cómo opera realmente una
mezcalería:

- **Botella cerrada y botella de copeo son partidas distintas** del mismo producto. Solo se
  consume de las abiertas, y abrir una botella es una operación con su propio registro.
- **Copeo modelado como receta**: el trago derecho es una receta de un solo ingrediente, así
  que el POS lo vende igual que un cóctel y el ERP le descuenta los mililitros exactos a la
  botella. El negocio mide en onzas y el inventario en mililitros; la conversión vive en un
  solo lugar.
- **Rendimiento por botella**: el catálogo muestra cuántos caballitos salen de cada
  presentación, que es el número con el que se administra una mezcalería.
- **Trazabilidad por marbete**: cada botella entra con su identificador único de fábrica.
- **PEPS entre lotes**: el consumo toma primero la partida abierta más antigua.
- **El inventario se descuenta al cerrar la cuenta**, no al capturar cada consumo. Esto no es
  una limitación técnica: es la consecuencia de que el mesero levanta la comanda en papel y la
  captura completa al cobrar. El sistema se adapta al negocio, no al revés.
- **Vender sin existencia alerta pero no bloquea el cobro.** La barra nunca se detiene por el
  sistema; el faltante queda registrado y visible hasta que un conteo físico lo resuelva.
- **El costo unitario nunca se captura a mano**: siempre se deriva de la presentación de
  compra, lo que elimina una fuente clásica de error.
- **Conversión de unidades en la recepción**: se compra por caja y se consume por mililitro,
  y el tamaño de la caja se confirma contra lo que realmente llegó.

### Cobertura de requisitos

Los 15 requisitos funcionales del alcance ERP están implementados:

| Requisito | Qué resuelve |
| --- | --- |
| RF-ERP-01 | Inventario inicial y cortes contra existencia física |
| RF-ERP-02 | Entradas, salidas y ajustes |
| RF-ERP-03 | Mermas expresadas como porcentaje |
| RF-ERP-04 | Existencias mínimas y máximas por producto |
| RF-ERP-05 | Control por lote con sugerencia del lote abierto |
| RF-ERP-06 | Caducidad por producto |
| RF-ERP-07 | Conversión de unidades por producto |
| RF-ERP-08 | Recetas tipo BOM con descuento automático |
| RF-ERP-09 | Copeo y botella cerrada como partidas distintas |
| RF-ERP-10 | Almacén único |
| RF-ERP-11 | Descuento al cierre de cuenta |
| RF-ERP-12 | Marbete por botella |
| RF-ERP-13 | Alerta de existencia en cero sin bloquear |
| RF-INT-01 | UUID generado en el cliente POS |
| RF-INT-02 | Descarte de reenvíos por identificador único |

---

## 5. Calidad: qué demuestra la suite

240 pruebas en tres niveles, todas ejecutándose en cada `push`:

| Nivel | Qué verifica |
| --- | --- |
| Dominio | Reglas puras: PEPS, existencias, costeo, mermas, diferencias de conteo |
| Integración | Operaciones completas contra la capa de datos, incluida la idempotencia |
| Componentes | Pantallas y formularios operados como lo haría una persona |

Las pruebas consultan la interfaz **por rol y texto accesible**, nunca por clases de estilo.
El efecto buscado es doble: las pruebas no se rompen al cambiar el diseño, y si un cambio
rompe la accesibilidad, rompe las pruebas.

### La suite ya pagó su costo

Cuatro defectos reales detectados y corregidos **antes de llegar a producción**:

1. Los controles de formulario no reenviaban la referencia al DOM, por lo que la librería de
   formularios no los veía: la pantalla se veía correcta pero **no precargaba ni validaba**.
2. La siembra de ventas no era idempotente y podía **descontar inventario dos veces**.
3. El cálculo de existencias descartaba los lotes agotados, lo que hacía **desaparecer del
   total** un faltante registrado.
4. El cálculo de días para caducar **mutaba la fecha** que recibía.

Ninguno era visible a simple vista. Los cuatro habrían aparecido en operación real.

### El sistema audita los datos del cliente

El costeo de recetas contrasta el costo calculado desde las dosis contra el costo que declara
el recetario, y marca las desviaciones en pantalla. Al cargar el recetario detectó dos casos
donde ambos no coinciden — un hallazgo de negocio que el sistema entrega al gerente sin que
nadie lo busque. La regla queda fijada en la suite: si el recetario se corrige, la prueba
avisa.

---

## 6. Listos para la API

El frontend **ya está preparado para conectarse**. La ruta de datos es:

```
componente  →  React Query  →  entities/<x>/api.ts  →  capa de datos
                                                       (aquí entra la API)
```

Tres decisiones tomadas desde el principio hacen que conectar la API sea sustitución, no
reescritura:

1. **Un solo punto de sustitución.** Toda la aplicación consume datos a través de las
   entidades. Cambiar la implementación no toca ningún componente, pantalla ni feature.
2. **El estado de servidor ya lo maneja React Query.** Caché, estados de carga, errores y
   revalidación están resueltos y probados; no aparecen cuando llegue la red.
3. **La lógica de negocio es TypeScript puro, sin React.** Las reglas de inventario están
   escritas para **moverse tal cual al backend**, de modo que no se implementen dos veces. Lo
   mismo con los esquemas Zod: validan el formulario hoy y validarán el request mañana.

### El contrato con la base compartida ya está analizado

Se realizó el mapeo completo entre el modelo del frontend y el esquema Postgres compartido con
el POS. Ese análisis — normalmente la parte más cara de arrancar un sprint de API — **está
hecho y documentado**, y es el insumo directo del plan de la sección siguiente.

Del análisis salieron dos confirmaciones valiosas:

- El diseño de idempotencia del frontend **coincide exactamente** con el esquema: la venta
  lleva el UUID del cliente como llave única y el folio legible lo asigna el servidor.
- El esquema versiona las recetas, lo que permite conservar el histórico de recetarios y
  activar el vigente sin perder los anteriores.

---

## 7. Próximo sprint: la API

El objetivo del sprint es sustituir la capa de datos por una API real sobre la base
compartida, sin cambiar una sola pantalla.

### Paquete 1 — Convergencia del modelo con el esquema

Alinear los tipos del frontend con las tablas compartidas. El mapeo ya está hecho; este
paquete lo ejecuta.

- Unificar insumo y cóctel en el modelo `producto` del esquema, con sus banderas de insumo y
  vendible
- Adoptar las presentaciones de compra múltiples por producto, que además resuelven mejor la
  conversión de unidades
- Adoptar el versionado de recetas del esquema
- Adoptar las referencias de movimiento del esquema

**Decisión a cerrar con el equipo:** el esquema guarda el costo en la línea de compra, no en
el catálogo. Hay que definir la política de costeo — último costo, promedio o PEPS — porque
determina el costo de cada cóctel.

### Paquete 2 — Existencias derivadas del kardex

El esquema calcula el saldo desde los movimientos en lugar de guardarlo. Es el diseño
correcto: hace del kardex la única fuente de verdad y elimina la posibilidad de que saldo y
movimientos se contradigan.

- Calcular existencia por agregación de movimientos
- Definir la estrategia de lectura rápida para las pantallas de consulta

### Paquete 3 — Endpoints y autenticación

- Endpoints de catálogo, inventario, compras y conteo
- Reutilizar los esquemas Zod del frontend como validación del request
- Portar la lógica de dominio al backend
- Autenticación real y activación de los roles del negocio

**Decisión a cerrar con el equipo del POS:** el conteo físico y el préstamo de envases están
implementados en el ERP y necesitan su lugar en el esquema compartido.

### Paquete 4 — Integración con el POS en vivo

- Recepción de ventas desde el POS contra la base compartida
- Verificación de la idempotencia extremo a extremo
- Réplica de catálogo, precios y recetas que el POS consume para operar sin conexión

### Paquete 5 — Identidad visual

Aplicar la identidad de Cuish sobre la librería de componentes existente. La separación por
capas permite hacerlo sin tocar lógica de negocio.

---

## 8. Decisiones de diseño

Decisiones tomadas deliberadamente, con su razón:

| Decisión | Razón |
| --- | --- |
| Capa de datos propia en vez de librería de mocks | La capa ya está aislada tras las entidades; una dependencia extra no acorta la ruta de migración |
| Componentes propios sobre elementos nativos | `<dialog>` y `<select>` ya traen foco, teclado y accesibilidad resueltos por el navegador |
| Tabla de datos propia | Sesenta líneas cubren orden y filtro, que es lo que estas pantallas necesitan |
| `Intl` en vez de librería de fechas | Cubre el formato `es-MX` sin dependencia |
| PWA sin cola offline de datos | El ERP opera con conexión; el trabajo offline es requisito del POS |
| Desktop-first | El negocio opera con un solo equipo en sitio |

Todas son reversibles y están documentadas en `CLAUDE.md`.
