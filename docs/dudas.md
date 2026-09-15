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

**Todo lo de esta sección toca el esquema compartido con el POS.** Ninguna se decide de un solo
lado.

> Actualizado el 2026-09-12 tras revisar la base viva (proyecto `dbcuish`). Dos dudas se
> cerraron solas y apareció una mucho más grande.

### 1.1 El catálogo cargado no coincide con el modelo de inventario

> **Corregido el 2026-09-13.** La primera versión de este punto decía que el POS y el ERP
> modelaban negocios distintos. Es más acotado que eso: **el esquema sí soporta el modelo del
> ERP**. Existen la tabla `lote` con marbete y caducidad, el enum `estado_lote` con
> `ABIERTO`/`CERRADO`, el tipo `BOTELLA_COPEO`, la unidad `oz`, las banderas `controla_lote` y
> `controla_caducidad`, la receta versionada y hasta una vista `vw_existencia_lote` que suma
> el kardex por lote. El diseño está. Lo que no coincide es **el dato cargado**.

Al conectarse a la base compartida, el catálogo cargado no se parece al que construyó el ERP,
y tampoco al documento de costeo que entregó el cliente.

| | ERP (lo que construimos) | Base compartida (lo que cargó el POS) |
| --- | --- | --- |
| Catálogo | 34 insumos y 18 cócteles del documento de costeo | 44 productos distintos: Espadín Joven, Tobalá, Pechuga Artesanal, Cozana, Paloma de Agave, Mezcalita de Jamaica, Flights de mezcal |
| Coincidencias entre ambos | — | **ninguna** |
| Unidad de medida | `ml`, `g` o `pz` según el producto | **`pz` para los 44**, incluso las botellas de 750 ml |
| Insumos | 34 productos marcados como insumo | **cero**: ningún producto tiene `es_insumo = true` |
| Recetas (BOM) | 18 cócteles y 5 servicios de copeo | tabla `receta` **vacía** |
| Lotes | 85 partidas con marbete y caducidad | tabla `lote` **vacía**; `controla_lote = false` en los 44 |
| Caducidad | derivada por categoría | `controla_caducidad = false` en los 44 |
| Movimientos | kardex por lote, en mililitros | 68 movimientos en piezas, **ninguno ligado a un lote** |
| Presentaciones de compra | una por insumo | tabla `producto_presentacion_compra` **vacía** |
| Proveedores y compras | implementados | tablas **vacías** |

**El esquema ya resolvió dos cosas bien, y conviene adoptarlas:**

- **La existencia se deriva del kardex, no se guarda.** Las vistas `vw_existencia_producto` y
  `vw_existencia_lote` suman `movimiento_inventario`. Es el diseño correcto y es lo que el ERP
  tiene que adoptar en el sprint de la API.
- **La alerta de bajo mínimo ya está definida** en `vw_existencia_producto` como
  `existencia <= stock_minimo`. El ERP usaba `<`, lo que hacía que en el mínimo exacto el POS
  dijera "bajo mínimo" y el ERP "en rango". Ya se alineó al de la base.

**Qué implica el dato cargado, en concreto:**

- **Sin insumos y sin recetas no hay BOM.** El descuento por explosión de receta (RF-ERP-08)
  no tiene de dónde descontar: no existe ningún producto que sea ingrediente de otro.
- **Con todo en piezas no se puede descontar por mililitro.** No se puede restar 45 ml de un
  producto cuya unidad es la pieza. Eso deja fuera el copeo y el costeo por dosis.
- **Con `controla_lote = false` en los 44 productos** se caen de golpe cuatro requisitos:
  control por lote (RF-ERP-05), caducidad (RF-ERP-06), copeo contra botella cerrada (RF-ERP-09)
  y marbete (RF-ERP-12).
- Los movimientos que ya existen son de tipo `AJUSTE` (carga inicial) y `SALIDA_VENTA`, en
  piezas y sin lote. Es un control de existencias por pieza, no un inventario por lote.

**Una cosa que el POS resolvió mejor que nosotros:** usa `producto_padre_id` para **variantes
de venta con precio propio**. "Margarita de Mezcal" es el padre, y se vende como "con espadín"
($110), "con reposado" ($130) o "con triple sec premium" ($100). Eso es más rico que nuestras
recetas planas y conviene adoptarlo.

**Lo que hay que decidir, y no es una decisión técnica:**

1. **¿El catálogo cargado es el definitivo o es dato de prueba?** El ERP ya se alineó a él,
   pero si son productos de ejemplo, hay que cargar los reales.
2. **¿Se encienden `controla_lote` y `controla_caducidad`?** Están apagados en los 44
   productos. Sin eso se caen cuatro requisitos del alcance, aunque el esquema los soporte.
3. **¿Quién marca qué productos son insumo y carga las recetas?** Son las dos piezas que hoy
   no existen en la base y sin las cuales no hay nada que descontar.

---

### 1.2 Dónde van las columnas de impuestos

**Decidido: el esquema lleva impuestos.** ClickBalance desglosa IVA e IEPS hoy y el sistema
nuevo tiene que poder hacer lo mismo. Verificado contra la base viva: **no existe ninguna
columna de impuestos en ninguna tabla**.

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

### 1.3 El conteo físico no tiene dónde guardarse

Verificado contra la base viva: **no existe tabla de conteo**, aunque el enum `tipo_movimiento`
sí contempla `CONTEO_FISICO`. Es decir, se puede registrar el ajuste pero no el documento del
conteo.

**Qué bloquea:** el corte contra existencia física (RF-ERP-01) no se puede persistir con folio
ni responsable. Hoy funciona solo en memoria en el ERP.

**Opciones:** agregar `conteo` y `conteo_linea` al esquema, o resolverlo únicamente con
movimientos de tipo `CONTEO_FISICO` y perder el registro de quién contó qué y cuándo.

**Recomendación:** agregar las tablas. Un conteo sin folio ni responsable no sirve como control
interno.

---

### 1.4 El préstamo de envases no tiene dónde guardarse

Verificado: **ninguna tabla ni columna de cascos o envases**. El control está implementado en
el ERP y no tiene dónde persistir. Salió del ticket de Modelo revisado (10 cascos) y no estaba
en los requisitos originales.

---

### 1.5 Qué política de costeo se usa

El esquema **no guarda el costo en el catálogo**: vive en `compra_linea.costo_unitario`, es
decir, es histórico por compra. Hoy esa tabla está vacía, así que **no hay ningún costo cargado
en la base**.

**Qué bloquea:** el costo de cada cóctel y el valor del inventario.

| Política | Qué significa |
| --- | --- |
| Último costo | Vale lo que costó la última compra. Simple, pero brinca con cada alza de precio |
| Costo promedio | Promedio ponderado de lo que hay en existencia. Estable |
| PEPS real | Cada lote conserva el costo con el que entró. El más exacto |

**Recomendación:** PEPS por lote, si se confirma que el inventario va por lote (ver 1.1).

---

### 1.6 Quién escribe qué en la base compartida

El POS y el ERP comparten la base. No está definido el reparto, y ahora se sabe que **RLS está
activo en las 16 tablas**, así que las políticas de acceso también hay que definirlas.

- ¿El POS escribe directo en Postgres, o pasa por la API del ERP?
- ¿Quién es dueño del catálogo de productos, precios y recetas? (El ERP los administra; el POS
  los consume.)
- ¿`categoria_menu` la administra el POS o el ERP?
- El esquema tiene `venta.descuento`: ¿quién autoriza descuentos y con qué regla?
- `turno_caja` ya tiene datos y es del POS, pero en `context.md` el arqueo de caja aparece como
  función del Encargado de Barra, que es rol de ERP. ¿De quién es?
- ¿Qué políticas de RLS aplican a cada rol?

**Qué bloquea:** el diseño de los endpoints y los permisos de escritura.

---

### 1.7 Las formas de pago del esquema no cubren lo que usa el negocio

El enum `metodo_pago` acepta **`EFECTIVO`, `TARJETA` y `TRANSFERENCIA`**. El levantamiento
(`context.md`) dice que el negocio maneja "efectivo, débito, crédito, transferencia y
**mixtos**".

**Qué falta:** decidir si débito y crédito se separan, y cómo se registra un pago mixto. La
tabla `venta_pago` admite varias filas por venta, así que el pago mixto **sí es
representable** — pero hay que confirmarlo como regla, no asumirlo.

**Es del POS, no del ERP**, pero afecta los reportes de venta.

---

## 2. Decisiones de negocio que bloquean funcionalidad

**Estas las contesta el gerente.** Cada una tiene una pantalla esperándola.

### 2.1 Cuántos mililitros sirve un caballito, y cuántos una mezcalina

El cliente dio **45 ml por caballito "por mientras"**. La mezcalina sigue sin medida.

**Y hay una contradicción que resolver:** el catálogo que cargó el POS vende el destilado
derecho como **"Trago 2 oz"**, que son **59 ml**, no 45. Son dos medidas distintas para el
mismo servicio. Si el trago real son 2 oz, el rendimiento y el costo cambian de golpe.

**Qué bloquea:**

- El **rendimiento de la botella**: con 45 ml, una botella de mezcal de 1 L da **22.2
  caballitos** y cada uno cuesta **$6.75**. Si en realidad sirven 60 ml, da 16.7 y cada uno
  cuesta $9.00 — **33% más caro de lo que creen**.
- La **mezcalina no existe** como producto vendible en el sistema, porque no sabemos qué
  descontarle a la botella.
- La medición de merma al servir.

**Cómo resolverlo:** con una jarra medidora en la barra. Servir un caballito y una mezcalina
como se sirven normalmente y anotar los mililitros. Quince minutos. De paso queda claro si el
"trago" del POS y el "caballito" son lo mismo o dos cosas distintas de la carta.

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

### 2.4 El costeo del cliente, para poder auditarlo

> **Cerrada el 2026-09-14.** Esta duda preguntaba por dos cócteles, Centella y Sbagliato, cuyo
> costo declarado no cuadraba con sus propias dosis. Ya no aplica: ninguno de los dos existe
> en el catálogo, porque la carta se alineó a la del POS.

Lo que queda es la necesidad de fondo. El sistema sabe contrastar el costo calculado desde las
dosis contra el costo que declare el cliente, y marcar las recetas que no cuadran. Hoy esa
comparación no tiene con qué trabajar: el catálogo del POS **no declara costo de producción**,
así que `costoDoc` viene en cero para las 34 recetas.

**Qué hace falta:** que el cliente entregue su hoja de costeo de la carta actual. En cuanto
exista, el contraste se enciende solo y vuelve a marcar las que no cuadren.

---

### 2.5 Si el préstamo de envases tiene costo

El control de cascos ya registra cuántos se prestaron y cuántos se devolvieron, por compra y
acumulado por proveedor. Falta saber si el proveedor **cobra un depósito** por cada casco, y si
ese depósito debe reflejarse en el costo de la mercancía.

---

## 3. Operación e infraestructura

### 3.1 Dónde vive la base de datos

Hoy existe y está operando un proyecto **Supabase**: organización CUISH, proyecto `dbcuish`
(ref `kxligfpzonyvjexrobkj`), Postgres 17, región us-west-2, plan Free. Ya tiene datos del POS
y el reporte técnico del POS lo da por hecho.

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

**El esquema ya los define**: el enum `rol_usuario` acepta `ADMIN`, `SUPERVISOR` y `CAJERO`, y
la tabla `usuario` ya tiene tres registros. O sea, los tres roles del negocio están
contemplados en la base.

**Hoy el ERP tiene un solo rol con acceso total**, por decisión tomada al arrancar el frontend.

**Qué hay que definir:** qué puede hacer `SUPERVISOR` que `ADMIN` no, y al revés, y qué
políticas de RLS le corresponden a cada uno (ver 1.6).

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
| ¿En qué unidad se miden las bebidas? | En onzas. El inventario se guarda en mililitros y el sistema convierte. El esquema acepta `oz` como unidad |
| ¿Qué valores aceptan los enums del esquema? | Ya extraídos de la base viva y documentados en `docs/db.sql`. Ver el resumen abajo |
| ¿El equipo del ERP tiene acceso a la base? | Sí. Organización CUISH, proyecto `dbcuish`, acceso de lectura confirmado |
| ¿El ticket lleva desglose de IVA e IEPS? | Sí. Se agregan las columnas al esquema (ver 1.3) |
| ¿Entra facturación al alcance? | No. Sin CFDI, sin timbrado, sin contabilidad. No se construye módulo fiscal |
| ¿La base es Supabase para siempre? | No. Hoy existe `dbcuish` en Supabase Free, pero el plan es Postgres autoalojado en Docker. El esquema no cambia (ver 3.1) |

### Los enums del esquema, ya resueltos

Extraídos de la base viva el 2026-09-12 y volcados a `docs/db.sql`. Antes venían como
`USER-DEFINED`, sin valores.

| Tipo | Valores |
| --- | --- |
| `rol_usuario` | `ADMIN`, `SUPERVISOR`, `CAJERO` |
| `unidad_medida` | `ml`, `g`, `pz`, `oz`, `porcion`, `carga` |
| `tipo_presentacion` | `BOTELLA_CERRADA`, `BOTELLA_COPEO`, `INSUMO`, `COMPUESTO` |
| `estado_lote` | `CERRADO`, `ABIERTO`, `AGOTADO` |
| `estado_cuenta` | `ABIERTA`, `CERRADA`, `CANCELADA` |
| `metodo_pago` | `EFECTIVO`, `TARJETA`, `TRANSFERENCIA` |
| `tipo_movimiento` | `ENTRADA_COMPRA`, `SALIDA_VENTA`, `AJUSTE`, `MERMA`, `APERTURA_BOTELLA`, `CONTEO_FISICO` |
| `tipo_punto_atencion` | `MESA`, `BARRA` |
| `punto_atencion` | `Mesa`, `Barra` |

Dos detalles que conviene limpiar con el equipo del POS:

- **Hay dos tipos para el mismo concepto**, `tipo_punto_atencion` y `punto_atencion`, que además
  difieren en mayúsculas. `cuenta.tipo_atencion` usa el primero; el segundo parece no usarse.
- **`tipo_movimiento` no tiene una salida genérica.** Existe `SALIDA_VENTA`, pero el ERP
  registra también salidas manuales que no vienen de una venta. Y `ENTRADA_COMPRA` asume que
  toda entrada viene de una compra, cuando el ERP permite recepción libre sin requisición.
