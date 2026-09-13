# Dudas abiertas — Cuish ERP

Preguntas sin responder que afectan al ERP, con **qué bloquean** y **qué asumimos mientras
tanto**. Cada una tiene dueño: quién puede contestarla.

Está ordenado por urgencia real, no por tema. Lo de arriba detiene trabajo; lo de abajo se
puede arrastrar.

**Cómo leerlo en una junta:** las secciones 1 y 2 son las que hay que cerrar antes del sprint
de la API. La 3 y la 4 se pueden responder en paralelo. La 6 es la lista de supuestos con los
que estamos operando hoy — si alguno está mal, hay que decirlo ahí mismo.

| Sección | Quién contesta | Cuántas |
| --- | --- | --- |
| 1. Bloquean el arranque de la API | Equipo técnico / POS | 6 |
| 2. Decisiones de negocio que bloquean funcionalidad | Gerente | 5 |
| 3. Contradicciones de alcance | Dueño / Gerente | 2 |
| 4. Operación e infraestructura | Dueño | 4 |
| 5. Alcance y roles | Gerente | 3 |

---

## 1. Bloquean el arranque de la API

**Estas hay que cerrarlas con el equipo del POS antes de escribir la primera línea del
backend.** No son preferencias: sin ellas el contrato de datos está incompleto.

### 1.0 Nadie del equipo ERP tiene acceso a la base compartida

Se intentó leer el esquema directamente del proyecto de Supabase para resolver las dudas de
esta sección. **La cuenta del equipo ERP no ve la organización CUISH**: solo alcanza a
`Charlie's Org`, con los proyectos `uao-eats-project` y `cocova-db`. Ninguno es la base de
Cuish.

**Qué bloquea:** todo lo demás de esta sección. Con acceso de lectura al proyecto, los puntos
1.1 y buena parte de 1.5 se contestan solos en minutos, sin ocupar a nadie del equipo del POS.

**Qué necesitamos:** invitación al proyecto de Supabase de Cuish con permiso de lectura, o
confirmación de con qué cuenta está dada de alta la organización.

---

### 1.1 Los enums del esquema no traen sus valores

El esquema compartido (`docs/db.sql`) declara **nueve columnas como `USER-DEFINED`** sin decir
qué valores acepta cada una:

| Tabla | Columna | Para qué sirve |
| --- | --- | --- |
| `usuario` | `rol` | Qué roles existen realmente en el sistema |
| `producto` | `unidad_base` | Unidades de medida permitidas |
| `producto` | `tipo` | Cómo se clasifica un producto |
| `receta_ingrediente` | `unidad` | Unidades permitidas en una receta |
| `lote` | `estado` | Sabemos que `CERRADO` existe; faltan los demás |
| `cuenta` | `estado` | Sabemos que `ABIERTA` existe; faltan los demás |
| `cuenta` | `tipo_atencion` | Mesa, barra, ¿qué más? |
| `venta_pago` | `metodo` | Formas de pago aceptadas |
| `movimiento_inventario` | `tipo` | Tipos de movimiento del kardex |

**Qué bloquea:** el ERP no puede validar ni mostrar valores que no conoce. Es la primera cosa
que se necesita para generar los tipos desde el esquema.

**Qué asumimos:** los valores que ya usa el ERP (`cerrada` / `abierta` / `agotada` para lotes;
`entrada`, `salida`, `ajuste`, `merma`, `apertura`, `venta`, `conteo` para movimientos).
**Muy probablemente no coincidan** con los del esquema.

**Lo que necesitamos:** el `CREATE TYPE` de cada uno, o la lista de valores. **Con acceso de
lectura al proyecto (punto 1.0) esto se resuelve sin preguntarle a nadie**, consultando
`pg_type` directamente.

---

### 1.2 ¿Dónde se guarda el conteo físico?

El conteo físico está implementado en el ERP y es un requisito del alcance (RF-ERP-01), pero
**no existe ninguna tabla para él** en el esquema compartido.

**Qué bloquea:** el corte contra existencia física no se puede persistir. Hoy funciona solo en
memoria.

**Opciones:** agregar `conteo` y `conteo_linea` al esquema, o resolverlo únicamente con
movimientos de ajuste y perder el registro de quién contó qué y cuándo.

**Recomendación:** agregar las tablas. Un conteo sin folio ni responsable no sirve como control
interno.

---

### 1.3 ¿Dónde se guarda el préstamo de envases?

Mismo caso. El control de cascos está implementado en el ERP y **no tiene lugar en el
esquema**. Salió del ticket de Modelo revisado (10 cascos) y no estaba en los requisitos
originales.

**Qué bloquea:** el adeudo de envases con el proveedor no se puede persistir.

---

### 1.4 ¿Qué política de costeo se usa?

El esquema **no guarda el costo en el catálogo**: vive en `compra_linea.costo_unitario`, es
decir, es histórico por compra. El ERP hoy usa un costo fijo por producto.

**Qué bloquea:** el costo de cada cóctel y el valor total del inventario. Hoy el dashboard
reporta **$21,902.38** de inventario con la regla actual; con otra política el número cambia.

**Opciones:**

| Política | Qué significa |
| --- | --- |
| Último costo | Vale lo que costó la última compra. Simple, pero brinca con cada alza de precio |
| Costo promedio | Promedio ponderado de lo que hay en existencia. Estable |
| PEPS real | Cada lote conserva el costo con el que entró. Es el más exacto y ya calza con el modelo de lotes |

**Recomendación:** PEPS por lote. El ERP ya guarda el costo unitario en cada lote, así que es
el que menos trabajo cuesta y el más fiel.

---

### 1.5 ¿Quién escribe qué en la base compartida?

El POS y el ERP comparten la base. No está definido el reparto.

- ¿El POS escribe directo en Postgres, o pasa por la API del ERP?
- ¿Quién es dueño del catálogo de productos, precios y recetas? (El ERP los administra; el POS
  los consume.)
- ¿`categoria_menu` la administra el POS o el ERP?
- El esquema tiene `venta.descuento`: ¿quién autoriza descuentos y con qué regla?
- `turno_caja` existe en el esquema. ¿El arqueo de caja es del POS o del ERP? En `context.md`
  el arqueo aparece como función del Encargado de Barra, que es rol de ERP.

**Qué bloquea:** el diseño de los endpoints y los permisos de escritura.

---

## 2. Decisiones de negocio que bloquean funcionalidad

**Estas las contesta el gerente.** Cada una tiene una pantalla esperándola.

### 2.1 ¿Cuántos mililitros sirve un caballito? ¿Y una mezcalina?

El cliente dio **45 ml por caballito "por mientras"**. La mezcalina sigue sin medida.

**Qué bloquea:**

- El **rendimiento de la botella**: con 45 ml, una botella de mezcal de 1 L da **22.2
  caballitos** y cada uno cuesta **$6.75**. Si en realidad sirven 60 ml, da 16.7 y cada uno
  cuesta $9.00 — **33% más caro de lo que creen**.
- La **mezcalina no existe** como producto vendible en el sistema, porque no sabemos qué
  descontarle a la botella.
- La medición de merma al servir.

**Cómo resolverlo:** con una jarra medidora en la barra. Servir un caballito y una mezcalina
como se sirven normalmente y anotar los mililitros. Quince minutos.

---

### 2.2 ¿En cuánto se vende el copeo?

Los servicios de copeo (mezcal, tequila, ginebra, vodka y ron servidos derechos) ya existen en
el catálogo, pero **sin precio de venta**. Aparecen marcados como "sin precio" en la pantalla
de Recetas.

**Qué bloquea:** el POS no los puede cobrar y no se puede calcular su margen.

---

### 2.3 ¿Cuáles son los mínimos y máximos reales por producto?

Es el semáforo de reposición: **mínimo** es cuándo avisar que hay que comprar, **máximo** es
cuándo ya se está inmovilizando dinero en bodega.

**Qué bloquea:** el contador de "Bajo mínimo" del dashboard y la lista de qué reponer. Si los
números están mal, la pantalla avisa cuando no toca o se calla cuando sí toca.

**Qué asumimos:** mínimo = 1.5 presentaciones de compra, máximo = 6. Para el mezcal eso es
avisar con 1.5 botellas y tope de 6. **Esos números los inventamos nosotros.**

**Cómo resolverlo:** la pregunta al gerente es *"¿con cuántas botellas de mezcal te pones
nervioso, y cuántas ya es desperdicio?"*. No hace falta para los 35 productos: con los diez
que más se mueven alcanza para empezar.

> Nota: con dos o tres meses de operación real el sistema puede proponerlos solo, a partir del
> consumo semanal medido. Pero eso requiere datos en producción.

---

### 2.4 Centella y Sbagliato: ¿la receta o el costo?

El sistema comparó las dosis de cada cóctel contra el costo que declara el recetario. **Dieciséis
de dieciocho cuadran dentro del 2%.** Dos no:

| Cóctel | El recetario dice | Sus dosis dan | Diferencia |
| --- | --- | --- | --- |
| Centella | $26.04 | **$20.29** | cobra $5.75 de más |
| Sbagliato | $43.35 | **$48.91** | cuesta $5.56 más de lo que cree |

**Sbagliato es el que importa**: se vende en $215 asumiendo un costo de $43.35, pero cuesta
$48.91. Se está perdiendo margen en cada uno.

**La pregunta:** ¿la receta está bien y el costo mal capturado, o a la receta le falta o le
sobra un ingrediente?

---

### 2.5 ¿El préstamo de envases tiene costo?

El control de cascos ya registra cuántos se prestaron y cuántos se devolvieron, por compra y
acumulado por proveedor. Falta saber si el proveedor **cobra un depósito** por cada casco, y
si ese depósito debe reflejarse en el costo de la mercancía.

---

## 3. Contradicciones de alcance

**Estas no son preguntas técnicas: son decisiones del dueño del negocio.**

### 3.1 Se apaga ClickBalance, pero la facturación queda fuera de alcance

Las dos cosas no pueden ser ciertas al mismo tiempo. Si ClickBalance se apaga por completo y
el sistema nuevo no factura, **nadie factura**.

**Las opciones son tres:**

1. ClickBalance se queda vivo solo para facturar.
2. La facturación entra al alcance (CFDI y timbrado, que es trabajo considerable y no está
   presupuestado).
3. El negocio deja de facturar, con lo que eso implica.

**Esto sigue sin respuesta desde el levantamiento inicial.** Conviene cerrarlo antes de que el
sistema nuevo entre en producción, no después.

---

### 3.2 ¿Qué pasa con los CFDI ya emitidos?

Al apagar ClickBalance, los comprobantes fiscales ya timbrados **deben conservarse por
obligación fiscal**. Nunca se preguntó cómo.

**Qué hay que definir:** si se exportan antes de apagar, en qué formato, y quién los resguarda.
Si ClickBalance se apaga sin exportarlos, se pierden.

---

## 4. Operación e infraestructura

### 4.1 "Sin renta mensual de servidor" vs. base en la nube

El levantamiento dice que **no hay presupuesto para renta mensual de servidor durante el MVP**,
pero la arquitectura acordada usa **Supabase**, que es un servicio hospedado y de pago cuando
se pasa del plan gratuito.

**Qué hay que definir:** si el plan gratuito alcanza para el MVP, quién paga la cuenta cuando
no alcance, y a nombre de quién queda el proyecto.

---

### 4.2 ¿El ticket debe seguir mostrando IVA e IEPS desglosados?

ClickBalance los desglosa hoy. **El esquema compartido no tiene ninguna columna de impuestos**,
así que hoy la respuesta del sistema es no.

**Qué hay que definir:** si el desglose es necesario, hay que agregarlo al esquema antes de
construir la API, no después.

---

### 4.3 ¿Cómo se lee el marbete?

Cada botella trae un identificador único de fábrica. Hoy **se captura a mano** en la pantalla
de recepción.

**Qué hay que definir:** si tienen lector de QR, si se usaría la cámara de un celular, o si se
queda la captura manual. Con 30 a 80 tickets por noche y varias botellas por semana, la
captura manual es viable; conviene confirmarlo.

---

### 4.4 Marca y modelo de la impresora térmica

Pendiente desde el levantamiento. **Es del POS, no del ERP**, pero sigue sin confirmarse y es
la única pieza de hardware del proyecto.

---

## 5. Alcance y roles

### 5.1 ¿Cuántos roles necesita el ERP?

`context.md` describe tres roles del negocio con permisos distintos:

| Rol | Qué haría en el ERP |
| --- | --- |
| Administrador / Gerente | Catálogo, precios, recetas, compras, proveedores, usuarios, reportes |
| Encargado / Supervisor de Barra | Recepción, conteos, ajustes, mermas, apertura de botella, arqueo |
| Mesero / Cajero | No entra al ERP (opera el POS) |

**Hoy el ERP tiene un solo rol con acceso total**, por decisión tomada al arrancar el frontend.

**Qué hay que definir:** si se separan los dos roles de ERP para producción. Si la respuesta es
sí, también hay que definir qué hace el Encargado que el Gerente no, y al revés.

---

### 5.2 ¿Hay tope de monto para una requisición de compra?

Ya quedó definido que la requisición la autoriza el usuario del ERP que la crea, y el sistema
guarda su nombre. **Falta saber si existe un tope**: si una compra arriba de cierto monto
necesita autorización de alguien más.

---

### 5.3 ¿De dónde sale el inventario inicial?

El sistema arranca con un inventario de ejemplo. Para producción hay que cargar el **inventario
real**: existencias, lotes abiertos, marbetes y caducidades.

**Qué hay que definir:** si se exporta de ClickBalance o si se levanta con un conteo físico
completo el día del arranque.

**Recomendación:** conteo físico. Es la única forma de que el sistema arranque cuadrado, y ya
existe la pantalla para capturarlo.

---

## 6. Supuestos con los que estamos operando

**Si alguno de estos está mal, hay que decirlo.** Están en el código y afectan lo que el
sistema muestra hoy.

| Supuesto | De dónde salió |
| --- | --- |
| Mínimo = 1.5 presentaciones, máximo = 6 | Lo inventamos nosotros |
| El caballito son 45 ml | Valor provisional del cliente |
| Los copeos son solo de destilados (mezcal, tequila, ginebra, vodka, ron) | Decisión nuestra |
| Las garnituras se dosifican con cantidades estimadas | El recetario las describe en texto, sin dosis |
| La cerveza cuesta $18 por pieza y viene de a 24 | Placeholder hasta ver una factura |
| Se controlan como botella: destilados, licores, vinos, salmuera y bitter | Decisión nuestra |
| Proveedores, lotes, marbetes, compras y ventas de ejemplo | Datos inventados para poder operar |

---

## 7. Ya resueltas — no volver a preguntar

Para que no se repitan en la siguiente junta:

| Pregunta | Respuesta |
| --- | --- |
| ¿Cuál recetario es el vigente? | El de la documentación entregada. Se administra desde el CRUD de Recetas |
| ¿Qué productos caducan? | Todos menos el alcohol, por regla de negocio |
| ¿Qué productos vienen por caja? | Lo decide el proveedor al momento de la compra; el sistema lo confirma al recibir |
| ¿Y la cerveza, que no estaba en el catálogo? | Se da de alta como un producto más |
| ¿Quién autoriza una requisición? | El usuario del ERP que la crea; el sistema guarda su nombre |
| ¿En qué unidad se miden las bebidas? | En onzas. El inventario se guarda en mililitros y el sistema convierte |
