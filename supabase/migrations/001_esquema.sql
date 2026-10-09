-- ============================================================================
-- MIGRACIÓN 001: 001_esquema.sql
-- Proyecto: Campus Sabor
-- Descripción: Creación de tipos ENUM, tablas del dominio, trigger de cálculo y vista de demanda
-- ============================================================================

-- Habilitar extensión pgcrypto para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.rol_usuario AS ENUM ('estudiante', 'cocina', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.tamano_porcion AS ENUM ('pequena', 'regular', 'grande');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.estado_pedido AS ENUM ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. TABLA: profiles (vinculada a auth.users de Supabase Auth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    codigo_estudiante TEXT UNIQUE,
    nombre TEXT NOT NULL,
    carrera TEXT,
    rol public.rol_usuario NOT NULL DEFAULT 'estudiante',
    preferencias TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    restricciones TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfiles extendidos de usuarios vinculados 1:1 con auth.users.';

-- ----------------------------------------------------------------------------
-- 3. TABLA: platos (Catálogo general del comedor)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    componentes TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    calorias INTEGER CHECK (calorias >= 0),
    imagen_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.platos IS 'Catálogo maestro de platos disponibles en el comedor.';

-- ----------------------------------------------------------------------------
-- 4. TABLA: menu_dia (Programación diaria del almuerzo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_dia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    plato_id UUID NOT NULL REFERENCES public.platos(id) ON DELETE RESTRICT,
    cantidad_preparada INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_preparada >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_menu_dia_fecha_plato UNIQUE (fecha, plato_id)
);

COMMENT ON TABLE public.menu_dia IS 'Asignación de platos ofertados y cantidad de porciones preparadas por fecha.';

-- ----------------------------------------------------------------------------
-- 5. TABLA: pedidos (Reservas de almuerzo de los estudiantes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero BIGINT GENERATED ALWAYS AS IDENTITY,
    estudiante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    menu_dia_id UUID NOT NULL REFERENCES public.menu_dia(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora_recojo TIME NOT NULL,
    porcion public.tamano_porcion NOT NULL DEFAULT 'regular',
    componentes_excluidos TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    estado public.estado_pedido NOT NULL DEFAULT 'pendiente',
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pedidos IS 'Órdenes realizadas por los estudiantes. El total y la fecha se aseguran por trigger.';

-- Índices para optimización de consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON public.profiles(rol);
CREATE INDEX IF NOT EXISTS idx_menu_dia_fecha ON public.menu_dia(fecha);
CREATE INDEX IF NOT EXISTS idx_pedidos_estudiante ON public.pedidos(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON public.pedidos(fecha);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);

-- ----------------------------------------------------------------------------
-- 6. TRIGGER: Cálculo asegurado de fecha y total en el servidor
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_calcular_pedido_total_y_fecha()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_precio_base NUMERIC(10,2);
    v_fecha_menu DATE;
    v_multiplicador NUMERIC(4,2);
BEGIN
    -- Obtener la fecha del menú y el precio del plato base
    SELECT md.fecha, p.precio
    INTO v_fecha_menu, v_precio_base
    FROM public.menu_dia md
    JOIN public.platos p ON p.id = md.plato_id
    WHERE md.id = NEW.menu_dia_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El menú del día asignado (ID: %) no existe o no tiene un plato válido.', NEW.menu_dia_id;
    END IF;

    -- Forzar la fecha del pedido a la fecha real del menú del día
    NEW.fecha := v_fecha_menu;

    -- Determinar multiplicador según tamaño de porción
    CASE NEW.porcion
        WHEN 'pequena' THEN v_multiplicador := 0.75;
        WHEN 'regular' THEN v_multiplicador := 1.00;
        WHEN 'grande'  THEN v_multiplicador := 1.25;
        ELSE v_multiplicador := 1.00;
    END CASE;

    -- Calcular el total con redondeo a 2 decimales
    NEW.total := ROUND(v_precio_base * v_multiplicador, 2);

    -- Actualizar timestamp
    NEW.updated_at := now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calcular_pedido_total_y_fecha ON public.pedidos;
CREATE TRIGGER trg_calcular_pedido_total_y_fecha
BEFORE INSERT OR UPDATE OF menu_dia_id, porcion ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_calcular_pedido_total_y_fecha();

-- ----------------------------------------------------------------------------
-- 7. VISTA: demanda_dia (Security Invoker para respetar RLS del invocador)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.demanda_dia
WITH (security_invoker = true)
AS
SELECT
    ped.fecha,
    pl.id AS plato_id,
    pl.codigo AS plato_codigo,
    pl.nombre AS plato_nombre,
    ped.porcion,
    COUNT(ped.id)::INTEGER AS total_pedidos,
    SUM(ped.total)::NUMERIC(10,2) AS total_estimado_recaudo
FROM public.pedidos ped
JOIN public.menu_dia md ON md.id = ped.menu_dia_id
JOIN public.platos pl ON pl.id = md.plato_id
WHERE ped.estado <> 'cancelado'
GROUP BY ped.fecha, pl.id, pl.codigo, pl.nombre, ped.porcion
ORDER BY ped.fecha DESC, pl.nombre ASC, ped.porcion ASC;

COMMENT ON VIEW public.demanda_dia IS 'Resumen consolidado de demanda en tiempo real para cocina y administración.';
