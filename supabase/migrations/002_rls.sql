-- ============================================================================
-- MIGRACIÓN 002: 002_rls.sql
-- Proyecto: Campus Sabor
-- Descripción: Funciones Security Definer, Políticas RLS y Trigger Anti-Escalación
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCIONES SECURITY DEFINER PARA EVITAR RECURSIÓN INFINITA EN RLS
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. POLÍTICAS RLS: PROFILES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
    auth.uid() = id OR public.es_staff()
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
    auth.uid() = id OR public.es_admin()
)
WITH CHECK (
    auth.uid() = id OR public.es_admin()
);

DROP POLICY IF EXISTS "profiles_insert_admin_policy" ON public.profiles;
CREATE POLICY "profiles_insert_admin_policy" ON public.profiles
FOR INSERT WITH CHECK (
    auth.uid() = id OR public.es_admin()
);

DROP POLICY IF EXISTS "profiles_delete_admin_policy" ON public.profiles;
CREATE POLICY "profiles_delete_admin_policy" ON public.profiles
FOR DELETE USING (
    public.es_admin()
);

-- ----------------------------------------------------------------------------
-- 4. POLÍTICAS RLS: PLATOS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "platos_select_policy" ON public.platos;
CREATE POLICY "platos_select_policy" ON public.platos
FOR SELECT USING (
    activo = true OR public.es_staff()
);

DROP POLICY IF EXISTS "platos_insert_admin_policy" ON public.platos;
CREATE POLICY "platos_insert_admin_policy" ON public.platos
FOR INSERT WITH CHECK (
    public.es_admin()
);

DROP POLICY IF EXISTS "platos_update_admin_policy" ON public.platos;
CREATE POLICY "platos_update_admin_policy" ON public.platos
FOR UPDATE USING (
    public.es_admin()
)
WITH CHECK (
    public.es_admin()
);

DROP POLICY IF EXISTS "platos_delete_admin_policy" ON public.platos;
CREATE POLICY "platos_delete_admin_policy" ON public.platos
FOR DELETE USING (
    public.es_admin()
);

-- ----------------------------------------------------------------------------
-- 5. POLÍTICAS RLS: MENU_DIA
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "menu_dia_select_policy" ON public.menu_dia;
CREATE POLICY "menu_dia_select_policy" ON public.menu_dia
FOR SELECT USING (
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "menu_dia_insert_admin_policy" ON public.menu_dia;
CREATE POLICY "menu_dia_insert_admin_policy" ON public.menu_dia
FOR INSERT WITH CHECK (
    public.es_admin()
);

DROP POLICY IF EXISTS "menu_dia_update_staff_policy" ON public.menu_dia;
CREATE POLICY "menu_dia_update_staff_policy" ON public.menu_dia
FOR UPDATE USING (
    public.es_staff()
)
WITH CHECK (
    public.es_staff()
);

DROP POLICY IF EXISTS "menu_dia_delete_admin_policy" ON public.menu_dia;
CREATE POLICY "menu_dia_delete_admin_policy" ON public.menu_dia
FOR DELETE USING (
    public.es_admin()
);

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS RLS: PEDIDOS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pedidos_select_policy" ON public.pedidos;
CREATE POLICY "pedidos_select_policy" ON public.pedidos
FOR SELECT USING (
    estudiante_id = auth.uid() OR public.es_staff()
);

DROP POLICY IF EXISTS "pedidos_insert_student_policy" ON public.pedidos;
CREATE POLICY "pedidos_insert_student_policy" ON public.pedidos
FOR INSERT WITH CHECK (
    auth.uid() = estudiante_id AND estado = 'pendiente'
);

-- Estudiantes solo pueden pasar su pedido a 'cancelado' si está 'pendiente'. Staff puede gestionar todos los estados.
DROP POLICY IF EXISTS "pedidos_update_policy" ON public.pedidos;
CREATE POLICY "pedidos_update_policy" ON public.pedidos
FOR UPDATE USING (
    (estudiante_id = auth.uid() AND estado = 'pendiente') OR public.es_staff()
)
WITH CHECK (
    (estudiante_id = auth.uid() AND estado = 'cancelado') OR public.es_staff()
);

DROP POLICY IF EXISTS "pedidos_delete_admin_policy" ON public.pedidos;
CREATE POLICY "pedidos_delete_admin_policy" ON public.pedidos
FOR DELETE USING (
    public.es_admin()
);

-- ----------------------------------------------------------------------------
-- 7. TRIGGER ANTI-ESCALACIÓN DE PRIVILEGIOS EN PROFILES
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_proteger_rol_y_activo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Permitir si se ejecuta con service_role (backend Server Actions),
    -- o desde el SQL Editor (donde auth.uid() es nulo),
    -- o si el usuario autenticado tiene rol de admin.
    IF (auth.jwt() ->> 'role') = 'service_role' 
       OR auth.uid() IS NULL 
       OR public.es_admin() THEN
        RETURN NEW;
    END IF;

    -- Si un usuario no admin intenta cambiar su propio rol
    IF NEW.rol IS DISTINCT FROM OLD.rol THEN
        RAISE EXCEPTION 'Operación denegada: No tienes privilegios para modificar el rol de usuario.';
    END IF;

    -- Si un usuario no admin intenta cambiar su estado activo
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
