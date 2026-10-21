-- ============================================================================
-- SCRIPT CONSOLIDADO DE INICIALIZACIÓN COMPLETA - CAMPUS SABOR
-- Proyecto: cxxctsdsonidzgjbmkhd
-- Ejecuta este script en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- ============================================================================
-- PARTE 1: MIGRACIÓN 001 - ESQUEMA BASE, TABLAS, TRIGGER Y VISTA
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    CREATE TYPE public.rol_usuario AS ENUM ('estudiante', 'cocina', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.tamano_porcion AS ENUM ('pequena', 'regular', 'grande');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.estado_pedido AS ENUM ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tabla profiles
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

-- Tabla platos
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

-- Tabla menu_dia
CREATE TABLE IF NOT EXISTS public.menu_dia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    plato_id UUID NOT NULL REFERENCES public.platos(id) ON DELETE RESTRICT,
    cantidad_preparada INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_preparada >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_menu_dia_fecha_plato UNIQUE (fecha, plato_id)
);

-- Tabla pedidos
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

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON public.profiles(rol);
CREATE INDEX IF NOT EXISTS idx_menu_dia_fecha ON public.menu_dia(fecha);
CREATE INDEX IF NOT EXISTS idx_pedidos_estudiante ON public.pedidos(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON public.pedidos(fecha);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);

-- Trigger de cálculo inmutable de fecha y total
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
    SELECT md.fecha, p.precio
    INTO v_fecha_menu, v_precio_base
    FROM public.menu_dia md
    JOIN public.platos p ON p.id = md.plato_id
    WHERE md.id = NEW.menu_dia_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El menú del día asignado (ID: %) no existe o no tiene un plato válido.', NEW.menu_dia_id;
    END IF;

    NEW.fecha := v_fecha_menu;

    CASE NEW.porcion
        WHEN 'pequena' THEN v_multiplicador := 0.75;
        WHEN 'regular' THEN v_multiplicador := 1.00;
        WHEN 'grande'  THEN v_multiplicador := 1.25;
        ELSE v_multiplicador := 1.00;
    END CASE;

    NEW.total := ROUND(v_precio_base * v_multiplicador, 2);
    NEW.updated_at := now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calcular_pedido_total_y_fecha ON public.pedidos;
CREATE TRIGGER trg_calcular_pedido_total_y_fecha
BEFORE INSERT OR UPDATE OF menu_dia_id, porcion ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_calcular_pedido_total_y_fecha();

-- Vista demanda_dia
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


-- ============================================================================
-- PARTE 2: MIGRACIÓN 002 - ROW LEVEL SECURITY (RLS) Y FUNCIONES DE SEGURIDAD
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mi_rol()
RETURNS public.rol_usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT rol FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT rol = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.es_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT rol IN ('admin', 'cocina') FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas: profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.es_staff());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.es_admin()) WITH CHECK (auth.uid() = id OR public.es_admin());

DROP POLICY IF EXISTS "profiles_insert_admin_policy" ON public.profiles;
CREATE POLICY "profiles_insert_admin_policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.es_admin());

DROP POLICY IF EXISTS "profiles_delete_admin_policy" ON public.profiles;
CREATE POLICY "profiles_delete_admin_policy" ON public.profiles FOR DELETE USING (public.es_admin());

-- Políticas: platos
DROP POLICY IF EXISTS "platos_select_policy" ON public.platos;
CREATE POLICY "platos_select_policy" ON public.platos FOR SELECT USING (activo = true OR public.es_staff());

DROP POLICY IF EXISTS "platos_insert_admin_policy" ON public.platos;
CREATE POLICY "platos_insert_admin_policy" ON public.platos FOR INSERT WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "platos_update_admin_policy" ON public.platos;
CREATE POLICY "platos_update_admin_policy" ON public.platos FOR UPDATE USING (public.es_admin()) WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "platos_delete_admin_policy" ON public.platos;
CREATE POLICY "platos_delete_admin_policy" ON public.platos FOR DELETE USING (public.es_admin());

-- Políticas: menu_dia
DROP POLICY IF EXISTS "menu_dia_select_policy" ON public.menu_dia;
CREATE POLICY "menu_dia_select_policy" ON public.menu_dia FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "menu_dia_insert_admin_policy" ON public.menu_dia;
CREATE POLICY "menu_dia_insert_admin_policy" ON public.menu_dia FOR INSERT WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "menu_dia_update_staff_policy" ON public.menu_dia;
CREATE POLICY "menu_dia_update_staff_policy" ON public.menu_dia FOR UPDATE USING (public.es_staff()) WITH CHECK (public.es_staff());

DROP POLICY IF EXISTS "menu_dia_delete_admin_policy" ON public.menu_dia;
CREATE POLICY "menu_dia_delete_admin_policy" ON public.menu_dia FOR DELETE USING (public.es_admin());

-- Políticas: pedidos
DROP POLICY IF EXISTS "pedidos_select_policy" ON public.pedidos;
CREATE POLICY "pedidos_select_policy" ON public.pedidos FOR SELECT USING (estudiante_id = auth.uid() OR public.es_staff());

DROP POLICY IF EXISTS "pedidos_insert_student_policy" ON public.pedidos;
CREATE POLICY "pedidos_insert_student_policy" ON public.pedidos FOR INSERT WITH CHECK (auth.uid() = estudiante_id AND estado = 'pendiente');

DROP POLICY IF EXISTS "pedidos_update_policy" ON public.pedidos;
CREATE POLICY "pedidos_update_policy" ON public.pedidos FOR UPDATE USING (
    (estudiante_id = auth.uid() AND estado = 'pendiente') OR public.es_staff()
) WITH CHECK (
    (estudiante_id = auth.uid() AND estado = 'cancelado') OR public.es_staff()
);

DROP POLICY IF EXISTS "pedidos_delete_admin_policy" ON public.pedidos;
CREATE POLICY "pedidos_delete_admin_policy" ON public.pedidos FOR DELETE USING (public.es_admin());

-- Trigger anti-escalación
CREATE OR REPLACE FUNCTION public.trg_fn_proteger_rol_y_activo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (auth.jwt() ->> 'role') = 'service_role' OR auth.uid() IS NULL OR public.es_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.rol IS DISTINCT FROM OLD.rol THEN
        RAISE EXCEPTION 'Operación denegada: No tienes privilegios para modificar el rol de usuario.';
    END IF;

    IF NEW.activo IS DISTINCT FROM OLD.activo THEN
        RAISE EXCEPTION 'Operación denegada: No tienes privilegios para modificar el estado de activación de usuario.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_rol_y_activo ON public.profiles;
CREATE TRIGGER trg_proteger_rol_y_activo
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_proteger_rol_y_activo();


-- ============================================================================
-- PARTE 3: MIGRACIÓN 003 - TRIGGER DE AUTENTICACIÓN
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        nombre,
        codigo_estudiante,
        carrera,
        rol,
        preferencias,
        restricciones,
        activo
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', 'Estudiante Nuevo'),
        NEW.raw_user_meta_data->>'codigo_estudiante',
        NEW.raw_user_meta_data->>'carrera',
        'estudiante',
        '{}'::TEXT[],
        '{}'::TEXT[],
        true
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- PARTE 4: SEMILLAS INICIALES (PLATOS Y MENÚ DEL DÍA)
-- ============================================================================
INSERT INTO public.platos (codigo, nombre, descripcion, componentes, precio, calorias, imagen_url, activo)
VALUES
(
    'PL-001',
    'Lomo Saltado Universitario',
    'Trozos de carne salteados al wok con cebolla, tomate, ají amarillo y sillao. Servido con papas fritas y arroz blanco.',
    ARRAY['Lomo de res', 'Cebolla', 'Tomate', 'Papas fritas', 'Arroz blanco', 'Culantro'],
    12.00,
    750,
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    true
),
(
    'PL-002',
    'Ají de Gallina Tradicional',
    'Pechuga deshilachada en crema de ají amarillo y leche, acompañada de papa sancochada, huevo cocido y aceituna.',
    ARRAY['Pechuga de pollo', 'Crema de ají amarillo', 'Arroz blanco', 'Papa sancochada', 'Huevo cocido', 'Aceituna botija'],
    10.00,
    680,
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800',
    true
),
(
    'PL-003',
    'Seco de Res con Frejoles',
    'Guiso de carne en salsa de culantro y chicha de jora, acompañado de frejoles canario y arroz blanco.',
    ARRAY['Carne de res', 'Frejoles canario', 'Arroz blanco', 'Salsa de culantro', 'Sarsa criolla'],
    11.50,
    820,
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800',
    true
),
(
    'PL-004',
    'Milanesa de Pollo con Ensalada Fresca',
    'Pechuga empanizada crujiente acompañada de papas doradas, arroz y ensalada mixta de lechuga, tomate y pepino.',
    ARRAY['Milanesa de pollo', 'Papas doradas', 'Arroz blanco', 'Ensalada fresca', 'Vinagreta de la casa'],
    10.50,
    620,
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
    true
),
(
    'PL-005',
    'Estofado de Lentejas Campestre (Opción Vegetariana)',
    'Guiso de lentejas caseras con verduras picadas, arroz integral y plátano frito.',
    ARRAY['Lentejas', 'Zanahoria', 'Arroz integral', 'Plátano frito', 'Sarsa criolla'],
    8.50,
    510,
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    true
)
ON CONFLICT (codigo) DO NOTHING;

-- Programar para hoy y mañana
INSERT INTO public.menu_dia (fecha, plato_id, cantidad_preparada)
SELECT CURRENT_DATE, id, 100
FROM public.platos
WHERE codigo IN ('PL-001', 'PL-002', 'PL-005')
ON CONFLICT (fecha, plato_id) DO NOTHING;

INSERT INTO public.menu_dia (fecha, plato_id, cantidad_preparada)
SELECT CURRENT_DATE + INTERVAL '1 day', id, 80
FROM public.platos
WHERE codigo IN ('PL-003', 'PL-004')
ON CONFLICT (fecha, plato_id) DO NOTHING;

-- ============================================================================
-- PARTE 5: MIGRACIÓN 004 - PREDICCIONES DE DEMANDA (MODELO IA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.predicciones_demanda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    plato_id UUID NOT NULL REFERENCES public.platos(id) ON DELETE CASCADE,
    porcion public.tamano_porcion NOT NULL,
    cantidad_predicha INTEGER NOT NULL CHECK (cantidad_predicha >= 0),
    confianza_score NUMERIC(4,3) NOT NULL DEFAULT 0.850 CHECK (confianza_score >= 0.0 AND confianza_score <= 1.0),
    metadatos JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_prediccion_fecha_plato_porcion UNIQUE (fecha, plato_id, porcion)
);

CREATE INDEX IF NOT EXISTS idx_predicciones_fecha ON public.predicciones_demanda(fecha);
CREATE INDEX IF NOT EXISTS idx_predicciones_plato ON public.predicciones_demanda(plato_id);

ALTER TABLE public.predicciones_demanda ENABLE ROW LEVEL SECURITY;

CREATE POLICY predicciones_leer ON public.predicciones_demanda FOR SELECT
    USING (public.es_staff());

CREATE POLICY predicciones_insertar ON public.predicciones_demanda FOR INSERT
    WITH CHECK (public.es_staff());

CREATE POLICY predicciones_actualizar ON public.predicciones_demanda FOR UPDATE
    USING (public.es_staff())
    WITH CHECK (public.es_staff());

CREATE POLICY predicciones_eliminar ON public.predicciones_demanda FOR DELETE
    USING (public.es_admin());

-- Predicciones de Demanda Iniciales generadas por el Modelo de IA
INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT CURRENT_DATE, id, 'pequena'::public.tamano_porcion, 26, 0.920, '{"modelo": "RandomForest_MultiOutput", "calorias": 750}'::jsonb
FROM public.platos WHERE codigo = 'PL-001'
ON CONFLICT (fecha, plato_id, porcion) DO NOTHING;

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT CURRENT_DATE, id, 'regular'::public.tamano_porcion, 67, 0.920, '{"modelo": "RandomForest_MultiOutput", "calorias": 750}'::jsonb
FROM public.platos WHERE codigo = 'PL-001'
ON CONFLICT (fecha, plato_id, porcion) DO NOTHING;

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT CURRENT_DATE, id, 'grande'::public.tamano_porcion, 24, 0.920, '{"modelo": "RandomForest_MultiOutput", "calorias": 750}'::jsonb
FROM public.platos WHERE codigo = 'PL-001'
ON CONFLICT (fecha, plato_id, porcion) DO NOTHING;

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT CURRENT_DATE, id, 'pequena'::public.tamano_porcion, 20, 0.910, '{"modelo": "RandomForest_MultiOutput", "calorias": 680}'::jsonb
FROM public.platos WHERE codigo = 'PL-002'
ON CONFLICT (fecha, plato_id, porcion) DO NOTHING;

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT CURRENT_DATE, id, 'regular'::public.tamano_porcion, 53, 0.910, '{"modelo": "RandomForest_MultiOutput", "calorias": 680}'::jsonb
FROM public.platos WHERE codigo = 'PL-002'
ON CONFLICT (fecha, plato_id, porcion) DO NOTHING;

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT CURRENT_DATE, id, 'grande'::public.tamano_porcion, 21, 0.910, '{"modelo": "RandomForest_MultiOutput", "calorias": 680}'::jsonb
FROM public.platos WHERE codigo = 'PL-002'
ON CONFLICT (fecha, plato_id, porcion) DO NOTHING;

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT CURRENT_DATE, id, 'pequena'::public.tamano_porcion, 14, 0.880, '{"modelo": "RandomForest_MultiOutput", "calorias": 510}'::jsonb
FROM public.platos WHERE codigo = 'PL-005'
ON CONFLICT (fecha, plato_id, porcion) DO NOTHING;

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT CURRENT_DATE, id, 'regular'::public.tamano_porcion, 38, 0.880, '{"modelo": "RandomForest_MultiOutput", "calorias": 510}'::jsonb
FROM public.platos WHERE codigo = 'PL-005'
ON CONFLICT (fecha, plato_id, porcion) DO NOTHING;

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT CURRENT_DATE, id, 'grande'::public.tamano_porcion, 14, 0.880, '{"modelo": "RandomForest_MultiOutput", "calorias": 510}'::jsonb
FROM public.platos WHERE codigo = 'PL-005'
ON CONFLICT (fecha, plato_id, porcion) DO NOTHING;
