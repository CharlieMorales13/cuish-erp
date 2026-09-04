# Requisitos del ERP por Módulo — Cuish

Requisitos funcionales del subsistema ERP para Cuish, organizados por módulo. Estilo IEEE 830-1998 / ISO/IEC/IEEE 29148:2018. [C] = requisito crítico, indispensable para el arranque productivo. Complementa a la [Bitácora de Proyecto · Cuish ERP + POS](https://app.notion.com/p/Bit-cora-de-Proyecto-Cuish-ERP-POS-3caae17afcc681f58034d2faae2092a6?pvs=21).

---

# Módulo de Inventario

| ID | Descripción | Prioridad | Fuente RF original |
| --- | --- | --- | --- |
| RF-ERP-01 | El sistema deberá permitir registrar el inventario inicial y realizar cortes contra la existencia física | Crítica [C] | RF-09 |
| RF-ERP-02 | El sistema deberá registrar entradas, salidas y ajustes de inventario | Crítica [C] | RF-10 |
| RF-ERP-03 | El sistema deberá permitir registrar mermas expresadas como porcentaje | Crítica [C] | RF-11 |
| RF-ERP-04 | El sistema deberá permitir definir existencias mínimas y máximas por producto | Crítica [C] | RF-12 |
| RF-ERP-09 | El sistema deberá tratar la botella de copeo (abierta) y la botella cerrada del mismo producto como partidas de inventario distintas | Crítica [C] | RF-17 |
| RF-ERP-10 | El sistema deberá operar sobre un único almacén físico | Crítica [C] | RF-18 |
| RF-ERP-13 | El sistema deberá mostrar una alerta informativa cuando la existencia de un producto llegue a cero al momento de capturar la cuenta, sin bloquear el cierre de la cuenta | Crítica [C] | RF-21 |

# Módulo de Trazabilidad (lotes, caducidad, marbete)

| ID | Descripción | Prioridad | Fuente RF original |
| --- | --- | --- | --- |
| RF-ERP-05 | El sistema deberá controlar por lote los suministros que salen de almacén, sugiriendo por defecto el lote actualmente abierto y permitiendo su modificación manual | Crítica [C] | RF-13 |
| RF-ERP-06 | El sistema deberá permitir registrar fecha de caducidad por producto, para los productos donde aplique (pendiente confirmar catálogo exacto con el cliente) | Crítica [C] | RF-14 |
| RF-ERP-12 | El sistema deberá permitir registrar el identificador de marbete de cada botella para fines de trazabilidad interna de inventario, sin propósito fiscal. El marbete ya trae identificador único de fábrica | Crítica [C] | RF-20 |

Supuesto de diseño: al asignarse el lote en el momento del registro (no en el instante del copeo), la trazabilidad es una atribución retroactiva, no un registro en tiempo real del consumo.

# Módulo de Producción y Recetas (BOM)

| ID | Descripción | Prioridad | Fuente RF original |
| --- | --- | --- | --- |
| RF-ERP-08 | El sistema deberá soportar recetas tipo BOM, descontando automáticamente los ingredientes y sus cantidades al vender un producto compuesto (ejemplo: un cóctel) | Crítica [C] | RF-16 |

Pendiente: recetas de cócteles aún no documentadas por el cliente, sujeto a levantamiento con el gerente.

# Módulo de Compras y Conversión de Unidades

| ID | Descripción | Prioridad | Fuente RF original |
| --- | --- | --- | --- |
| RF-ERP-07 | El sistema deberá soportar conversión de unidades por producto (ejemplo: compra por caja de 24, venta por pieza; botella a onzas) | Crítica [C] | RF-15 |

Pendiente: confirmar con el cliente qué productos específicos usan empaque por caja más allá de cerveza.

# Módulo de Integración POS ↔ ERP

| ID | Descripción | Prioridad | Fuente RF original |
| --- | --- | --- | --- |
| RF-ERP-11 | El sistema deberá descontar el inventario correspondiente en el momento del cierre de la cuenta, no en el momento de la captura individual de cada consumo | Crítica [C] | RF-19 |
| RF-INT-01 | El identificador único de cada venta deberá generarse en el cliente POS (UUID) al momento de la captura; el folio legible para el cliente final se asignará en el servidor al sincronizar | Crítica [C] | — |
| RF-INT-02 | El servidor deberá descartar reenvíos de una misma venta por identificador único, para evitar descuentos duplicados de inventario | Crítica [C] | — |
| RF-INT-03 | El POS deberá mantener una réplica local de solo lectura del catálogo, precios y recetas vigentes, para operar sin conexión | Crítica [C] | — |
| RF-INT-04 | El POS deberá sincronizar automáticamente las ventas pendientes al recuperar conexión a internet, mostrando un indicador visual del número de operaciones pendientes | Alta | — |

---

*Documento vivo. Las actualizaciones de alcance o prioridad se registran primero en la Bitácora de Proyecto y se reflejan aquí una vez estabilizadas.*