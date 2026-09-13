# Dudas abiertas — Cuish ERP

Preguntas sin responder que afectan al ERP, con **qué bloquean** y **qué asumimos mientras
tanto**. Cada una tiene dueño: quién puede contestarla.

Está ordenado por urgencia real, no por tema. Lo de arriba detiene trabajo; lo de abajo se
puede arrastrar.

**Cómo leerlo en una junta:** la sección 1 hay que cerrarla con el equipo del POS antes del
sprint de la API, porque toca el esquema compartido y ese no se cambia unilateralmente. La 2
la contesta el gerente y se puede avanzar en paralelo. La 5 es la lista de supuestos con los
que estamos operando hoy: si alguno está mal, hay que decirlo ahí mismo.

| Sección | Quién contesta | Cuántas |
| --- | --- | --- |
| 1. Bloquean el arranque de la API | Equipo técnico / POS | 7 |
| 2. Decisiones de negocio que bloquean funcionalidad | Gerente | 5 |
| 3. Operación e infraestructura | Equipo técnico / Dueño | 3 |
| 4. Alcance y roles | Gerente | 3 |

---

## 1. Bloquean el arranque de la API

**Todo lo de esta sección toca el esquema compartido con el POS.** Ninguna se decide de un
solo lado.

### 1.1 El equipo del ERP no tiene acceso a la base compartida

La organización **CUISH** existe, con el proyecto **`dbcuish`** (AWS us-west-2, plan Free,
instancia Nano). Pero las herramientas del equipo ERP están autorizadas contra otra cuenta y
**no alcanzan esa organización**.

**Qué bloquea:** buena parte de esta sección. Con acceso de lectura, el punto 1.2 se contesta
solo en minutos, sin ocupar a nadie del equipo del POS.

**Qué necesitamos:** que se dé de alta al equipo ERP en la organización CUISH con permiso de
lectura, y el identificador del proyecto. Si la base se muda a Postgres autoalojado (ver 3.1),
lo equivalente: cadena de conexión de solo lectura.

---

### 1.2 Los enums del esquema no traen sus valores

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

**Qué bloquea:** el ERP no puede validar ni mostrar valores que no conoce. Es lo primero que se
necesita para generar los tipos desde el esquema.

**Qué asumimos:** los valores que ya usa el ERP (`cerrada` / `abierta` / `agotada` para lotes;
`entrada`, `salida`, `ajuste`, `merma`, `apertura`, `venta`, `conteo` para movimientos).
**Muy probablemente no coincidan** con los del esquema.

**Lo que necesitamos:** el `CREATE TYPE` de cada uno, o la lista de valores. **Con acceso de
lectura (punto 1.1) esto se resuelve sin preguntarle a nadie**, consultando `pg_type`.

---

### 1.3 Dónde van las columnas de impuestos

**Decidido: el esquema lleva impuestos.** ClickBalance desglosa IVA e IEPS hoy y el sistema
nuevo tiene que poder hacer lo mismo. Hoy **el esquema no tiene ninguna columna de impuestos**.

Esto no contradice el alcance: mostrar el desglose en el ticket no es facturar. No hay CFDI ni
timbrado de por medio.

**Lo que falta definir, con el equipo del POS:**

1. **Dónde vive la tasa.** El IEPS de bebidas alcohólicas depende del grado del producto, así
   que no es una tasa única: es un atributo por producto.
2. **Dónde vive el monto.** Si se guarda calculado por línea de venta o se recalcula al
   imprimir. Guardarlo lo vuelve histórico y sobrevive a un cambio de tasas.

**Propuesta para llevar a la junta:**

| Tabla | Columna | Para qué |
| --- | --- | --- |
| `producto` | `tasa_ieps numeric` | El IEPS cambia según el grado alcohólico |
| `producto` | `tasa_iva numeric` | Normalmente 16%, pero explícito evita suposiciones |
| `venta_linea` | `base numeric` | Importe antes de impuestos |
| `venta_linea` | `ieps_monto numeric` | Congelado al momento de la venta |
| `venta_linea` | `iva_monto numeric` | Congelado al momento de la venta |

**Qué bloquea:** si esto se agrega después de construir la API, hay que tocar el esquema, los
endpoints y el ticket otra vez. Es más barato ahora.

**Además falta del cliente:** la tasa de IEPS que aplica a cada familia de producto. Eso lo
confirma su contador, no nosotros.

---

### 1.4 El conteo físico no tiene dónde guardarse

El conteo físico está implementado en el ERP y es un requisito del alcance (RF-ERP-01), pero
**no existe ninguna tabla para él** en el esquema compartido.

**Qué bloquea:** el corte contra existencia física no se puede persistir. Hoy funciona solo en
memoria.

**Opciones:** agregar `conteo` y `conteo_linea` al esquema, o resolverlo únicamente con
movimientos de ajuste y perder el registro de quién contó qué y cuándo.

**Recomendación:** agregar las tablas. Un conteo sin folio ni responsable no sirve como control
interno.

---

### 1.5 El préstamo de envases no tiene dónde guardarse

Mismo caso. El control de cascos está implementado en el ERP y **no tiene lugar en el
esquema**. Salió del ticket de Modelo revisado (10 cascos) y no estaba en los requisitos
originales.

**Qué bloquea:** el adeudo de envases con el proveedor no se puede persistir.

---

### 1.6 Qué política de costeo se usa

El esquema **no guarda el costo en el catálogo**: vive en `compra_linea.costo_unitario`, es
decir, es histórico por compra. El ERP hoy usa un costo fijo por producto.

**Qué bloquea:** el costo de cada cóctel y el valor total del inventario. Hoy el dashboard
reporta **$21,902.38** de inventario con la regla actual; con otra política el número cambia.

| Política | Qué significa |
| --- | --- |
| Último costo | Vale lo que costó la última compra. Simple, pero brinca con cada alza de precio |
| Costo promedio | Promedio ponderado de lo que hay en existencia. Estable |
| PEPS real | Cada lote conserva el costo con el que entró. El más exacto |

**Recomendación:** PEPS por lote. El ERP ya guarda el costo unitario en cada lote, así que es
el que menos trabajo cuesta y el más fiel al modelo que ya existe.

---

### 1.7 Quién escribe qué en la base compartida

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

### 2.1 Cuántos mililitros sirve un caballito, y cuántos una mezcalina

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

### 2.2 En cuánto se vende el copeo

Los servicios de copeo (mezcal, tequila, ginebra, vodka y ron servidos derechos) ya existen en
el catálogo, pero **sin precio de venta**. Aparecen marcados como "sin precio" en la pantalla
de Recetas.

**Qué bloquea:** el POS no los puede cobrar y no se puede calcular su margen.

---

### 2.3 Cuáles son los mínimos y máximos reales por producto

Es el semáforo de reposición: **mínimo** es cuándo avisar que hay que comprar, **máximo** es
cuándo ya se está inmovilizando dinero en bodega.

**Qué bloquea:** el contador de "Bajo mínimo" del dashboard y la lista de qué reponer. Si los
números están mal, la pantalla avisa cuando no toca o se calla cuando sí toca.

**Qué asumimos:** mínimo = 1.5 presentaciones de compra, máximo = 6. Para el mezcal eso es
avisar con 1.5 botellas y tope de 6. **Esos números los inventamos nosotros.**

**Cómo resolverlo:** la pregunta al gerente es *"¿con cuántas botellas de mezcal te pones
nervioso, y cuántas ya es desperdicio?"*. No hace falta para los 35 productos: con los diez
que más se mueven alcanza para empezar.

> Con dos o tres meses de operación real el sistema puede proponerlos solo, a partir del
> consumo semanal medido. Pero eso requiere datos en producción.

---

### 2.4 Centella y Sbagliato: la receta o el costo

El sistema comparó las dosis de cada cóctel contra el costo que declara el recetario.
**Dieciséis de dieciocho cuadran dentro del 2%.** Dos no:

| Cóctel | El recetario dice | Sus dosis dan | Diferencia |
| --- | --- | --- | --- |
| Centella | $26.04 | **$20.29** | cobra $5.75 de más |
| Sbagliato | $43.35 | **$48.91** | cuesta $5.56 más de lo que cree |

**Sbagliato es el que importa**: se vende en $215 asumiendo un costo de $43.35, pero cuesta
$48.91. Se está perdiendo margen en cada uno.

**La pregunta:** ¿la receta está bien y el costo mal capturado, o a la receta le falta o le
sobra un ingrediente?

---

### 2.5 Si el préstamo de envases tiene costo

El control de cascos ya registra cuántos se prestaron y cuántos se devolvieron, por compra y
acumulado por proveedor. Falta saber si el proveedor **cobra un depósito** por cada casco, y si
ese depósito debe reflejarse en el costo de la mercancía.

---

## 3. Operación e infraestructura

### 3.1 Dónde vive la base de datos

Hoy existe un proyecto **Supabase** (organización CUISH, proyecto `dbcuish`, plan Free,
instancia Nano), y el reporte técnico del POS lo da por hecho.

El plan del ERP es distinto: **Postgres autoalojado en Docker sobre una VM gratuita** para el
MVP, para no depender de un servicio de pago.

**Qué hay que definir:** si se queda en Supabase o se muda, cuándo, y quién levanta y mantiene
la instancia. El esquema es el mismo en cualquiera de las dos, así que la decisión **no
retrasa** el diseño de los tipos ni el desarrollo de la API — pero sí determina a dónde apunta
la cadena de conexión y qué credenciales se reparten.

**A tener en cuenta si se va por Docker en VM:** hay que resolver por nuestra cuenta lo que
Supabase regala — respaldos, acceso desde fuera de la VM y autenticación. No es impedimento,
es trabajo que hay que poner en el sprint.

---

### 3.2 Cómo se lee el marbete

Cada botella trae un identificador único de fábrica. Hoy **se captura a mano** en la pantalla
de recepción.

**Qué hay que definir:** si tienen lector de QR, si se usaría la cámara de un celular, o si se
queda la captura manual. Con el volumen que maneja el negocio la captura manual es viable;
conviene confirmarlo.

---

### 3.3 Marca y modelo de la impresora térmica

Pendiente desde el levantamiento. **Es del POS, no del ERP**, pero sigue sin confirmarse y es
la única pieza de hardware del proyecto.

---

## 4. Alcance y roles

### 4.1 Cuántos roles necesita el ERP

`context.md` describe tres roles del negocio con permisos distintos:

| Rol | Qué haría en el ERP |
| --- | --- |
| Administrador / Gerente | Catálogo, precios, recetas, compras, proveedores, usuarios, reportes |
| Encargado / Supervisor de Barra | Recepción, conteos, ajustes, mermas, apertura de botella, arqueo |
| Mesero / Cajero | No entra al ERP (opera el POS) |

**Hoy el ERP tiene un solo rol con acceso total**, por decisión tomada al arrancar el frontend.

**Qué hay que definir:** si se separan los dos roles de ERP para producción, y qué hace el
Encargado que el Gerente no, y al revés.

---

### 4.2 Si hay tope de monto para una requisición de compra

Ya quedó definido que la requisición la autoriza el usuario del ERP que la crea, y el sistema
guarda su nombre. **Falta saber si existe un tope**: si una compra arriba de cierto monto
necesita autorización de alguien más.

---

### 4.3 De dónde sale el inventario inicial

El sistema arranca con un inventario de ejemplo. Para producción hay que cargar el **inventario
real**: existencias, lotes abiertos, marbetes y caducidades.

**Qué hay que definir:** si se exporta del sistema actual o si se levanta con un conteo físico
completo el día del arranque.

**Recomendación:** conteo físico. Es la única forma de que el sistema arranque cuadrado, y ya
existe la pantalla para capturarlo.

---

## 5. Supuestos con los que estamos operando

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

## 6. Ya resueltas — no volver a preguntar

Para que no se repitan en la siguiente junta:

| Pregunta | Respuesta |
| --- | --- |
| ¿Cuál recetario es el vigente? | El de la documentación entregada. Se administra desde el CRUD de Recetas |
| ¿Qué productos caducan? | Todos menos el alcohol, por regla de negocio |
| ¿Qué productos vienen por caja? | Lo decide el proveedor al momento de la compra; el sistema lo confirma al recibir |
| ¿Y la cerveza, que no estaba en el catálogo? | Se da de alta como un producto más |
| ¿Quién autoriza una requisición? | El usuario del ERP que la crea; el sistema guarda su nombre |
| ¿En qué unidad se miden las bebidas? | En onzas. El inventario se guarda en mililitros y el sistema convierte |
| ¿El ticket lleva desglose de IVA e IEPS? | Sí. Se agregan las columnas al esquema (ver 1.3) |
| ¿Entra facturación al alcance? | No. Sin CFDI, sin timbrado, sin contabilidad. No se construye módulo fiscal |
| ¿La base es Supabase para siempre? | No. Hoy existe `dbcuish` en Supabase Free, pero el plan es Postgres autoalojado en Docker. El esquema no cambia (ver 3.1) |
