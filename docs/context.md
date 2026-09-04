Contexto de negocio: Cuish
El cliente

Cuish es una mezcalería y coctelería con presencia en Oaxaca. El proyecto trabaja exclusivamente sobre el área de bar: tragos, cocteles y mezcal en copeo. No hay alimentos en el alcance.

Cómo opera hoy

Usan ClickBalance (CB) como sistema actual. Contra lo que se pensó en la primera videollamada, el sistema no es tan limitado: ya maneja desglose de IVA e IEPS por separado, formas de pago (efectivo, débito, crédito, transferencia y mixtos), tipos de venta (ticket, factura, cotización, envío a domicilio), listas de precio, almacén y manejo de moneda. Corre nativo en escritorio con base local y sincronización contra una base en la nube.

El problema real no es el software, es que el inventario no se alimenta a tiempo. Ese es el dolor que motiva el proyecto.

El flujo de trabajo actual

El mesero toma la comanda en papel durante el servicio, anotando lo que pide cada mesa y cada cliente de barra. Al momento de cobrar, captura toda esa comanda en el sistema de un solo golpe. La comanda física queda como control cruzado.

Este proceso no se va a cambiar. El sistema nuevo se adapta a él, no al revés. De ahí sale la decisión de que el inventario se descuente al cerrar la cuenta, no al momento del consumo.

Escala y físico del negocio
Una sola caja
Entre 30 y 80 tickets en una noche fuerte
Aproximadamente una mesa, el resto son barras (la principal y otra pegada a la pared)
Un solo almacén físico
Cuenta abierta por mesa o barra, se paga completa, sin división entre clientes
Solo pesos mexicanos, solo venta directa (no usan cotización, apartado ni envío a domicilio)
El catálogo y el costeo

Manejan 34 insumos costeados, desde destilados y licores hasta garnituras y desechables, con presentación de compra y costo unitario definidos. El rango es amplio: desde hielo a $0.005/g hasta Italicus a $1.41/ml y aceituna gordal a $4.96/pieza.

18 cócteles de menú con receta estandarizada, costo de producción y precio sugerido. Los márgenes van de $23.13 de costo (Mojito, se vende en $115) hasta $112.28 (Italicus Spritz, se vende en $560).

Existe una alerta pendiente aquí: hay dos versiones del recetario que no coinciden entre sí (cambian dosificaciones e incluso ingredientes base, por ejemplo Martini Sucio pasa de ginebra a vodka). Hay que confirmar cuál es el vigente con el gerente antes de cargarlo.

Particularidades del negocio del mezcal
Copeo vs botella cerrada son inventarios distintos. Una botella abierta para servir copas es una partida diferente a una botella sellada en stock, aunque sean del mismo producto.
El copeo se descuenta por onza (un caballito equivale a un número fijo de onzas, una mezcalina a otro).
Cada botella trae marbete con identificador único de fábrica, útil para trazabilidad interna.
Se manejan conversiones de unidad por producto: compra por caja de 24 y venta por pieza (cerveza), botella a onzas (destilados).
Los cócteles consumen múltiples insumos por receta, así que una venta descuenta de varias partidas a la vez.
Compras a proveedor incluyen préstamo y devolución de envase (10 cascos en el ticket de Modelo revisado), un control que no estaba en los requerimientos originales.
Los roles del negocio
Administrador / Gerente General: catálogo, precios, recetas, compras, proveedores, usuarios, reportes globales
Encargado / Supervisor de Barra: recepción de mercancía, conteos físicos, ajustes, mermas, apertura de botella, autorización de cancelaciones, arqueo de caja
Mesero / Cajero: cuentas por mesa, captura de comanda al cobrar, cobro, ticket, apertura y cierre de su caja
Restricciones que impone el cliente
Un solo equipo en el negocio, sin presupuesto para comprar hardware nuevo
Impresora térmica por USB (marca y modelo aún sin confirmar)
Internet estable en el local, pero el POS debe seguir cobrando sin conexión
Sin renta mensual de servidor durante el MVP, lo considerarían hasta producción
CB se apaga por completo cuando entre el sistema nuevo
Todo lo fiscal queda fuera de alcance: sin facturación, sin CFDI, sin timbrado, sin contabilidad
Contradicción de negocio sin resolver

CB se apaga por completo, pero la facturación queda fuera de alcance. Si nadie factura, alguna de las dos afirmaciones tiene que ceder. Sigue pendiente la respuesta del cliente. Relacionado: al apagar CB, los CFDI ya emitidos deben conservarse por obligación fiscal del cliente, y eso no se ha preguntado.

Otros pendientes con el cliente
Marca y modelo de la impresora térmica
Cuál recetario es el vigente
Qué productos aplican a caducidad real (el mezcal prácticamente no caduca; jarabes y perecederos sí)
Qué productos vienen empacados por caja además de cerveza
Onzas exactas por caballito y por mezcalina, para calcular rendimiento y merma
Quién autoriza una requisición de compra y si hay tope de monto
Manejo del envase de cerveza (préstamo y devolución)
Si el ticket nuevo debe seguir mostrando desglose de IVA e IEPS
Si tienen lector de QR para el marbete o se usaría cámara de celular