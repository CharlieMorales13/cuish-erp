-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- ---------------------------------------------------------------------------
-- Tipos enumerados. El volcado original los dejaba como USER-DEFINED, sin sus
-- valores. Extraídos de la base viva (proyecto dbcuish) el 2026-09-12.
-- ---------------------------------------------------------------------------

CREATE TYPE public.rol_usuario AS ENUM ('ADMIN', 'SUPERVISOR', 'CAJERO');

CREATE TYPE public.unidad_medida AS ENUM ('ml', 'g', 'pz', 'oz', 'porcion', 'carga');

CREATE TYPE public.tipo_presentacion AS ENUM (
  'BOTELLA_CERRADA', 'BOTELLA_COPEO', 'INSUMO', 'COMPUESTO'
);

CREATE TYPE public.estado_lote AS ENUM ('CERRADO', 'ABIERTO', 'AGOTADO');

CREATE TYPE public.estado_cuenta AS ENUM ('ABIERTA', 'CERRADA', 'CANCELADA');

CREATE TYPE public.metodo_pago AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');

CREATE TYPE public.tipo_movimiento AS ENUM (
  'ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE', 'MERMA', 'APERTURA_BOTELLA', 'CONTEO_FISICO'
);

-- Ojo: hay dos tipos para el mismo concepto y difieren en mayúsculas.
-- `cuenta.tipo_atencion` usa tipo_punto_atencion; `punto_atencion` parece no usarse.
CREATE TYPE public.tipo_punto_atencion AS ENUM ('MESA', 'BARRA');
CREATE TYPE public.punto_atencion AS ENUM ('Mesa', 'Barra');

-- ---------------------------------------------------------------------------

CREATE TABLE public.usuario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  num_empleado text UNIQUE,
  password_hash text NOT NULL,
  rol USER-DEFINED NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT usuario_pkey PRIMARY KEY (id)
);
CREATE TABLE public.producto (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria text NOT NULL CHECK (categoria = ANY (ARRAY['Destilados'::text, 'Licores'::text, 'Vinos'::text, 'Mezcladores'::text, 'Jarabes'::text, 'Perecederos'::text, 'Garnituras'::text, 'Secos'::text, 'Desechables'::text, 'Cafe'::text, 'Cocteles'::text, 'Cervezas'::text])),
  unidad_base USER-DEFINED NOT NULL,
  tipo USER-DEFINED NOT NULL,
  producto_padre_id uuid,
  es_vendible boolean NOT NULL DEFAULT false,
  es_insumo boolean NOT NULL DEFAULT false,
  precio_venta numeric,
  stock_minimo numeric,
  stock_maximo numeric,
  controla_lote boolean NOT NULL DEFAULT false,
  controla_caducidad boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  categoria_menu_id uuid,
  CONSTRAINT producto_pkey PRIMARY KEY (id),
  CONSTRAINT producto_producto_padre_id_fkey FOREIGN KEY (producto_padre_id) REFERENCES public.producto(id),
  CONSTRAINT producto_categoria_menu_id_fkey FOREIGN KEY (categoria_menu_id) REFERENCES public.categoria_menu(id)
);
CREATE TABLE public.producto_presentacion_compra (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  descripcion text NOT NULL,
  cantidad_en_unidad_base numeric NOT NULL CHECK (cantidad_en_unidad_base > 0::numeric),
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT producto_presentacion_compra_pkey PRIMARY KEY (id),
  CONSTRAINT producto_presentacion_compra_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(id)
);
CREATE TABLE public.receta (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  activa boolean NOT NULL DEFAULT true,
  vigente_desde timestamp with time zone NOT NULL DEFAULT now(),
  nota text,
  CONSTRAINT receta_pkey PRIMARY KEY (id),
  CONSTRAINT receta_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(id)
);
CREATE TABLE public.receta_ingrediente (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receta_id uuid NOT NULL,
  insumo_id uuid NOT NULL,
  cantidad numeric NOT NULL CHECK (cantidad > 0::numeric),
  unidad USER-DEFINED NOT NULL,
  CONSTRAINT receta_ingrediente_pkey PRIMARY KEY (id),
  CONSTRAINT receta_ingrediente_receta_id_fkey FOREIGN KEY (receta_id) REFERENCES public.receta(id),
  CONSTRAINT receta_ingrediente_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.producto(id)
);
CREATE TABLE public.proveedor (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  contacto text,
  telefono text,
  activo boolean NOT NULL DEFAULT true,
  email character varying,
  CONSTRAINT proveedor_pkey PRIMARY KEY (id)
);
CREATE TABLE public.compra (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  proveedor_id uuid,
  folio_externo text,
  fecha timestamp with time zone NOT NULL DEFAULT now(),
  total numeric NOT NULL DEFAULT 0,
  usuario_id uuid,
  nota text,
  CONSTRAINT compra_pkey PRIMARY KEY (id),
  CONSTRAINT compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedor(id),
  CONSTRAINT compra_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id)
);
CREATE TABLE public.lote (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  marbete_id text UNIQUE,
  compra_id uuid,
  cantidad_inicial numeric NOT NULL CHECK (cantidad_inicial > 0::numeric),
  fecha_recepcion timestamp with time zone NOT NULL DEFAULT now(),
  fecha_caducidad date,
  fecha_apertura timestamp with time zone,
  estado USER-DEFINED NOT NULL DEFAULT 'CERRADO'::estado_lote,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lote_pkey PRIMARY KEY (id),
  CONSTRAINT lote_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(id),
  CONSTRAINT lote_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compra(id)
);
CREATE TABLE public.compra_linea (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  compra_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  presentacion_id uuid,
  cantidad numeric NOT NULL CHECK (cantidad > 0::numeric),
  costo_unitario numeric NOT NULL,
  lote_id uuid,
  CONSTRAINT compra_linea_pkey PRIMARY KEY (id),
  CONSTRAINT compra_linea_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compra(id),
  CONSTRAINT compra_linea_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(id),
  CONSTRAINT compra_linea_presentacion_id_fkey FOREIGN KEY (presentacion_id) REFERENCES public.producto_presentacion_compra(id),
  CONSTRAINT compra_linea_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lote(id)
);
CREATE TABLE public.turno_caja (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  abierto_en timestamp with time zone NOT NULL DEFAULT now(),
  cerrado_en timestamp with time zone,
  monto_inicial numeric NOT NULL DEFAULT 0,
  monto_final_declarado numeric,
  monto_final_calculado numeric,
  nota text,
  CONSTRAINT turno_caja_pkey PRIMARY KEY (id),
  CONSTRAINT turno_caja_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id)
);
CREATE TABLE public.cuenta (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uuid_cliente uuid NOT NULL UNIQUE,
  estado USER-DEFINED NOT NULL DEFAULT 'ABIERTA'::estado_cuenta,
  abierta_en timestamp with time zone NOT NULL DEFAULT now(),
  cerrada_en timestamp with time zone,
  usuario_id uuid,
  nota text,
  tipo_atencion USER-DEFINED NOT NULL,
  CONSTRAINT cuenta_pkey PRIMARY KEY (id),
  CONSTRAINT cuenta_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id)
);
CREATE TABLE public.venta (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uuid_cliente uuid NOT NULL UNIQUE,
  folio bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  cuenta_id uuid,
  turno_caja_id uuid,
  subtotal numeric NOT NULL DEFAULT 0,
  descuento numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL CHECK (total >= 0::numeric),
  cerrada_en timestamp with time zone NOT NULL DEFAULT now(),
  sincronizada_en timestamp with time zone NOT NULL DEFAULT now(),
  usuario_id uuid,
  CONSTRAINT venta_pkey PRIMARY KEY (id),
  CONSTRAINT venta_cuenta_id_fkey FOREIGN KEY (cuenta_id) REFERENCES public.cuenta(id),
  CONSTRAINT venta_turno_caja_id_fkey FOREIGN KEY (turno_caja_id) REFERENCES public.turno_caja(id),
  CONSTRAINT venta_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id)
);
CREATE TABLE public.venta_linea (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  cantidad numeric NOT NULL CHECK (cantidad > 0::numeric),
  precio_unitario numeric NOT NULL,
  receta_id uuid,
  lote_id uuid,
  CONSTRAINT venta_linea_pkey PRIMARY KEY (id),
  CONSTRAINT venta_linea_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id),
  CONSTRAINT venta_linea_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(id),
  CONSTRAINT venta_linea_receta_id_fkey FOREIGN KEY (receta_id) REFERENCES public.receta(id),
  CONSTRAINT venta_linea_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lote(id)
);
CREATE TABLE public.venta_pago (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL,
  metodo USER-DEFINED NOT NULL,
  monto numeric NOT NULL CHECK (monto > 0::numeric),
  CONSTRAINT venta_pago_pkey PRIMARY KEY (id),
  CONSTRAINT venta_pago_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id)
);
CREATE TABLE public.movimiento_inventario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  lote_id uuid,
  tipo USER-DEFINED NOT NULL,
  cantidad numeric NOT NULL CHECK (cantidad <> 0::numeric),
  unidad USER-DEFINED NOT NULL,
  referencia_tipo text,
  referencia_id uuid,
  usuario_id uuid,
  nota text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT movimiento_inventario_pkey PRIMARY KEY (id),
  CONSTRAINT movimiento_inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(id),
  CONSTRAINT movimiento_inventario_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lote(id),
  CONSTRAINT movimiento_inventario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id)
);
CREATE TABLE public.categoria_menu (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT categoria_menu_pkey PRIMARY KEY (id)
);
-- ---------------------------------------------------------------------------
-- Vistas. No venían en el volcado original; leídas de la base viva el 2026-09-13.
-- Son la definición oficial de "existencia": se deriva del kardex, no se guarda.
-- ---------------------------------------------------------------------------

CREATE VIEW public.vw_existencia_producto AS
  SELECT p.id AS producto_id, p.nombre, p.categoria, p.tipo, p.unidad_base,
         COALESCE(sum(m.cantidad), 0::numeric) AS existencia,
         p.stock_minimo, p.stock_maximo,
         (p.stock_minimo IS NOT NULL
          AND COALESCE(sum(m.cantidad), 0::numeric) <= p.stock_minimo) AS bajo_minimo
    FROM producto p
    LEFT JOIN movimiento_inventario m ON m.producto_id = p.id
   WHERE p.activo
   GROUP BY p.id, p.nombre, p.categoria, p.tipo, p.unidad_base,
            p.stock_minimo, p.stock_maximo;

CREATE VIEW public.vw_existencia_lote AS
  SELECT l.id AS lote_id, l.producto_id, p.nombre AS producto,
         l.marbete_id, l.estado, l.fecha_caducidad,
         COALESCE(sum(m.cantidad), 0::numeric) AS existencia
    FROM lote l
    JOIN producto p ON p.id = l.producto_id
    LEFT JOIN movimiento_inventario m ON m.lote_id = l.id
   GROUP BY l.id, l.producto_id, p.nombre, l.marbete_id, l.estado, l.fecha_caducidad;
