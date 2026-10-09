# Plan de Desarrollo: Campus Sabor
**Plataforma Integral de Gestión de Pedidos y Optimización de Demanda para el Comedor Universitario**

---

## 1. Resumen y Suposiciones

### 1.1 Resumen Ejecutivo
El comedor universitario **"Campus Sabor"** experimenta actualmente un desperdicio alimentario recurrente de entre el **15% y el 30%** de la comida preparada diariamente. Este problema se origina principalmente en dos factores:
1. **Falta de predictibilidad en la cocina:** El equipo de cocina no dispone de métricas previas sobre el volumen total de comensales ni sobre la distribución de la demanda por tipo de plato.
2. **Inflexibilidad en las porciones:** Se sirven raciones estandarizadas a todos los estudiantes sin considerar su apetito real, nivel de actividad física o preferencias particulares.

**Solución Arquitectónica:**
Una plataforma desacoplada y reactiva que digitaliza el flujo de pedidos previo al turno de almuerzo:
- **App Android Nativa (Estudiantes):** Permite explorar el menú planificado del día, personalizar componentes (exclusión de ingredientes), seleccionar la porción adecuada (`pequena`, `regular`, `grande`) y reservar la hora de recojo.
- **Portal Web de Administración (Cocina y Administradores):** Provee a la cocina un panel analítico en tiempo real de demanda agregada por plato y porción, control de inventario/menú del día y gestión del estado de cada orden, además de control integral de usuarios y catálogo para la administración.
- **Backend Serviceless Unificado (Supabase / PostgreSQL):** Centraliza la autenticación, seguridad a nivel de filas (RLS), integridad transaccional mediante triggers y vistas agregadas seguras.

---

### 1.2 Suposiciones Fijas y de Negocio
1. **Comedor y Turno Único:** Un único local físico de comedor universitario y un único turno de almuerzo diario (11:30 AM a 3:30 PM).
2. **Estructura de Precios por Porción:**
   - Porción **Pequeña**: Multiplicador $0.75\times$ sobre el precio base del plato.
   - Porción **Regular**: Multiplicador $1.00\times$ sobre el precio base del plato.
   - Porción **Grande**: Multiplicador $1.25\times$ sobre el precio base del plato.
3. **Flujo de Pago en Caja (MVP):** El estudiante reserva en la app y abona el total directamente en la caja física del comedor al momento de recoger la comida. La integración de pasarelas de pago digitales (Yape/Plin/tarjeta) se pospone a la versión v2.
4. **Modelo de Roles y Aprovisionamiento:**
   - `estudiante`: Autorregistro libre desde la app móvil.
   - `cocina`: Cuentas creadas o asignadas por un usuario con rol `admin` desde el portal web.
   - `admin`: Asignado por otro `admin` en la web. El **primer administrador** de la plataforma se inicializa manualmente mediante una consulta SQL en el SQL Editor de Supabase.
5. **Horario Límite de Pedido (Suposición de Operación):** Los pedidos para el almuerzo del día se pueden registrar hasta las 11:00 AM del mismo día (configurable en base de datos en v2).

---

### 1.3 Tabla del Stack Tecnológico y Versiones Estables Seleccionadas

| Componente / Capa | Tecnología / Librería | Versión Estable | Justificación Técnica y Arquitectónica |
| :--- | :--- | :--- | :--- |
| **Android - Lenguaje** | Kotlin | `2.0.21` | Compilador K2 estable con soporte nativo de Compose Compiler Plugin sin dependencias externas. |
| **Android - UI Toolkit** | Jetpack Compose (BOM) | `2024.10.01` | Estabilidad en Material 3 (`1.3.1`), gestión declarativa de UI y renderizado reactivo sin XML. |
| **Android - Arquitectura** | Android Architecture Components | MVVM + StateFlow | Desacoplamiento estricto: UI reactiva orientada a `StateFlow` inmutable y `SharedFlow` para eventos de un solo disparo. |
| **Android - Inyección Deps** | Dagger Hilt | `2.52` | Estándar de facto en Android para DI en tiempo de compilación con integración nativa con ViewModels. |
| **Android - Navegación** | Navigation Compose | `2.8.3` | Navegación basada en tipos seguros (*Type-Safe Navigation*) nativa de Compose. |
| **Android - SDK Supabase** | `supabase-kt` (BOM) | `3.0.3` | SDK Kotlin Multiplatform oficial. Incluye módulos `auth-kt` y `postgrest-kt`. |
| **Android - Motor HTTP** | Ktor Client (OkHttp engine) | `3.0.1` | Motor de transporte asíncrono no bloqueante requerido por `supabase-kt`. |
| **Android - Min SDK / Target** | Android SDK | `minSdk 26` / `targetSdk 35` | Cubre más del 95% de dispositivos activos con soporte moderno de APIs de fecha/hora (`java.time`). |
| **Web - Framework** | Next.js (App Router) | `14.2.15 LTS` | Arquitectura basada en React Server Components (RSC), Server Actions nativas y SSR de alto rendimiento. |
| **Web - Lenguaje** | TypeScript | `5.6.3` | Tipado estático riguroso y sincronización directa con los esquemas generados de PostgreSQL. |
| **Web - Estilos** | Tailwind CSS | `3.4.14` | Framework CSS utilitario de compilación estática (v3 probada y estable con App Router). |
| **Web - Supabase Adapter** | `@supabase/ssr` / `@supabase/supabase-js` | `0.5.2` / `2.46.1` | Manejo seguro de tokens JWT en cookies HTTP-only para Server Components y Server Actions. |
| **Web - Validación** | Zod | `3.23.8` | Validación de esquemas y tipos en tiempo de ejecución para formularios y Server Actions. |
| **Web - Iconos** | Lucide React | `0.454.0` | Set optimizado de iconos SVG ligeros para el panel administrativo. |
| **Backend / DB** | Supabase Managed PostgreSQL | `v15.6+` (Postgres) | Base de datos relacional con RLS, extensiones `pgcrypto`, triggers transaccionales y GoTrue Auth. |

---

## 2. Arquitectura General

### 2.1 Diagrama de Arquitectura de la Solución (Mermaid)

```mermaid
flowchart TB
    subgraph Cliente_Android ["App Android Nativa (Estudiantes)"]
        UI_Compose["Jetpack Compose UI\n(Material 3)"]
        VM["ViewModels & StateFlow"]
        Repo_Android["Repositories (Domain & Data)"]
        Supabase_KT["supabase-kt Client\n(auth-kt + postgrest-kt)"]
        UI_Compose --> VM
        VM --> Repo_Android
        Repo_Android --> Supabase_KT
    end

    subgraph Cliente_Web ["Navegador Web (Admin & Cocina)"]
        Web_UI["React Client Components\n(Forms, Dashboard, Modales)"]
        Web_Page["React Server Components (RSC)\n(SSR Pages con cookies)"]
    end

    subgraph Backend_Next ["Next.js Server (App Router)"]
        Middleware["middleware.ts\n(Protección de rutas & Verificación de Rol)"]
        Server_Actions["Server Actions\n(usuarios/actions.ts, pedidos, platos)"]
        Admin_Client["Supabase Admin Client\n(lib/supabase/admin.ts)"]
        Server_Client["Supabase Server Client\n(lib/supabase/server.ts)"]
        
        Web_UI -->|Invocación RPC| Server_Actions
        Web_Page --> Server_Client
        Server_Actions --> Admin_Client
        Server_Actions --> Server_Client
    end

    subgraph Supabase_Cloud ["Plataforma Supabase"]
        Auth_Service["Supabase Auth (GoTrue)\n- JWT con User ID & Metadata\n- Gestión de credenciales"]
        
        subgraph Postgres_Engine ["PostgreSQL 15+"]
            RLS_Engine{"Motor de Políticas RLS\n(Security Definer Helpers:\nmi_rol(), es_admin(), es_staff())"}
            
            subgraph Esquema_Public ["Esquema public"]
                T_Profiles[("profiles\n(id = auth.users.id)")]
                T_Platos[("platos\n(catálogo)")]
                T_Menu[("menu_dia\n(planificación)")]
                T_Pedidos[("pedidos\n(órdenes)")]
                V_Demanda[("Vista: demanda_dia\n(security_invoker = true)")]
                Triggers["Triggers:\n- Cálculo de total y fecha\n- Protección de rol/activo\n- Creación automática de perfil"]
            end
        end
    end

    %% Conexiones Estudiantes (Android)
    Supabase_KT -->|1. Auth (email/password)\n+ SUPABASE_ANON_KEY| Auth_Service
    Supabase_KT -->|2. Consultas PostgREST con JWT de Usuario\n+ SUPABASE_ANON_KEY| RLS_Engine

    %% Conexiones Web
    Cliente_Web -->|Peticiones HTTP / Cookies de sesión| Middleware
    Middleware --> Auth_Service
    Server_Client -->|3. Queries con JWT de Sesión (Cookie)\n+ NEXT_PUBLIC_SUPABASE_ANON_KEY| RLS_Engine
    Admin_Client ==>|4. OPERACIONES PRIVILEGIADAS\n(Crear staff, eliminar usuarios, forzar roles)\nSUPABASE_SERVICE_ROLE_KEY| Postgres_Engine

    %% Internas DB
    RLS_Engine --> T_Profiles
    RLS_Engine --> T_Platos
    RLS_Engine --> T_Menu
    RLS_Engine --> T_Pedidos
    RLS_Engine --> V_Demanda
    T_Pedidos -.-> Triggers
    T_Profiles -.-> Triggers
```

### 2.2 Delimitación de Seguridad y Uso de Claves
> [!IMPORTANT]
> **Aislamiento de la clave de servicio (`service_role`):**
> 1. La clave `SUPABASE_SERVICE_ROLE_KEY` otorga acceso total de superusuario ignorando todas las políticas RLS. **Bajo ninguna circunstancia debe estar presente en el código de la app Android ni en el bundle del cliente Web**.
> 2. La app Android utiliza exclusivamente `SUPABASE_ANON_KEY` y el token JWT emitido por Supabase Auth. Todas sus consultas son evaluadas rigurosamente por el motor RLS.
> 3. En la Web, las páginas y lecturas estándar usan el cliente de sesión (`lib/supabase/server.ts`) respaldado por cookies y la clave anónima.
> 4. La clave `service_role` reside exclusivamente en `lib/supabase/admin.ts` y se invoca únicamente dentro de **Server Actions** que ejecutan operaciones administrativas restringidas (creación directa de usuarios de cocina sin confirmación de email, desactivación forzada y borrado de cuentas en `auth.users`).

---

## 3. Esquema de Base de Datos (`001_esquema.sql`)

El siguiente script SQL define los tipos enumerados, tablas relacionales, llaves foráneas, triggers de cálculo inmutable y vistas agregadas de optimización.

```sql
-- ============================================================================
-- MIGRACIÓN 001: 001_esquema.sql
-- Descripción: Creación de tipos ENUM, tablas base, triggers de cálculo y vista de demanda
-- ============================================================================

-- Habilitar extensión pgcrypto para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TIPOS ENUMERADOS
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

-- 2. TABLA: profiles (vinculada a auth.users)
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

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendidos desde Supabase Auth.';

-- 3. TABLA: platos (catálogo general)
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

COMMENT ON TABLE public.platos IS 'Catálogo maestro de platos disponibles en el comedor universitario.';

-- 4. TABLA: menu_dia (programación diaria del almuerzo)
CREATE TABLE IF NOT EXISTS public.menu_dia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    plato_id UUID NOT NULL REFERENCES public.platos(id) ON DELETE RESTRICT,
    cantidad_preparada INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_preparada >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_menu_dia_fecha_plato UNIQUE (fecha, plato_id)
);

COMMENT ON TABLE public.menu_dia IS 'Asignación de platos disponibles y porciones planificadas por fecha.';

-- 5. TABLA: pedidos (reservas de los estudiantes)
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

COMMENT ON TABLE public.pedidos IS 'Órdenes de almuerzo realizadas por estudiantes con cálculo de total asegurado por trigger.';

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON public.profiles(rol);
CREATE INDEX IF NOT EXISTS idx_menu_dia_fecha ON public.menu_dia(fecha);
CREATE INDEX IF NOT EXISTS idx_pedidos_estudiante ON public.pedidos(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON public.pedidos(fecha);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);

-- ============================================================================
-- 6. TRIGGER: Cálculo de fecha y total de pedido en el servidor
-- ============================================================================
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
    -- Obtener la fecha del menú y el precio base del plato asociado
    SELECT md.fecha, p.precio
    INTO v_fecha_menu, v_precio_base
    FROM public.menu_dia md
    JOIN public.platos p ON p.id = md.plato_id
    WHERE md.id = NEW.menu_dia_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El menú del día asignado (ID: %) no existe o no tiene un plato válido asociado.', NEW.menu_dia_id;
    END IF;

    -- Forzar incondicionalmente la fecha del pedido a la fecha real del menú del día
    NEW.fecha := v_fecha_menu;

    -- Aplicar multiplicadores oficiales por tamaño de porción
    CASE NEW.porcion
        WHEN 'pequena' THEN v_multiplicador := 0.75;
        WHEN 'regular' THEN v_multiplicador := 1.00;
        WHEN 'grande'  THEN v_multiplicador := 1.25;
        ELSE v_multiplicador := 1.00;
    END CASE;

    -- El total se calcula en el servidor. El cliente no puede inyectar un precio manipulado.
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

-- ============================================================================
-- 7. VISTA: demanda_dia (Security Invoker para respetar RLS del invocador)
-- ============================================================================
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
```

---

## 4. Políticas de Seguridad a Nivel de Filas (`002_rls.sql`)

### 4.1 Matriz de Permisos por Rol

| Tabla / Vista | Operación | Estudiante | Cocina | Admin | Anónimo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **profiles** | `SELECT` | Solo su propio perfil (`id = auth.uid()`) | Todos los perfiles | Todos los perfiles | Denegado |
| **profiles** | `INSERT` | Vía trigger de registro (su propio ID) | Denegado directo | Vía Admin Server Action | Denegado |
| **profiles** | `UPDATE` | Datos propios (sin modificar rol/activo) | Denegado | Todos los perfiles | Denegado |
| **profiles** | `DELETE` | Denegado | Denegado | Permitido | Denegado |
| **platos** | `SELECT` | Solo platos con `activo = true` | Todos los platos | Todos los platos | Denegado |
| **platos** | `INSERT/UPDATE/DELETE` | Denegado | Denegado | Permitido | Denegado |
| **menu_dia** | `SELECT` | Todos los menús programados | Todos los menús | Todos los menús | Denegado |
| **menu_dia** | `INSERT/DELETE` | Denegado | Denegado | Permitido | Denegado |
| **menu_dia** | `UPDATE` | Denegado | Solo `cantidad_preparada` | Permitido | Denegado |
| **pedidos** | `SELECT` | Solo sus pedidos (`estudiante_id = auth.uid()`) | Todos los pedidos | Todos los pedidos | Denegado |
| **pedidos** | `INSERT` | Permitido (solo para sí mismo, estado `pendiente`) | Denegado | Permitido | Denegado |
| **pedidos** | `UPDATE` | Solo cancelar si el estado es `pendiente` | Cambio de estado operacional | Control total | Denegado |
| **demanda_dia** | `SELECT` | Denegado (RLS subyacente filtra a solo sus datos) | Vista completa agregada | Vista completa agregada | Denegado |

---

### 4.2 Script SQL de Políticas y Funciones Anti-Recursión (`002_rls.sql`)

```sql
-- ============================================================================
-- MIGRACIÓN 002: 002_rls.sql
-- Descripción: Funciones Security Definer, Habilitación de RLS, Políticas y Trigger Anti-Escalación
-- ============================================================================

-- 1. FUNCIONES SECURITY DEFINER PARA PREVENIR RECURSIÓN INFINITA EN RLS
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

-- 2. HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POLÍTICAS: PROFILES
-- ============================================================================
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

-- ============================================================================
-- 4. POLÍTICAS: PLATOS
-- ============================================================================
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

-- ============================================================================
-- 5. POLÍTICAS: MENU_DIA
-- ============================================================================
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

-- ============================================================================
-- 6. POLÍTICAS: PEDIDOS
-- ============================================================================
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

-- Estudiantes solo pueden pasar a 'cancelado' si está 'pendiente'. Staff puede transicionar de estado.
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

-- ============================================================================
-- 7. TRIGGER ANTI-ESCALACIÓN DE PRIVILEGIOS EN PROFILES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trg_fn_proteger_rol_y_activo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Permitir si la acción se ejecuta desde el backend mediante service_role,
    -- o directamente en el SQL Editor (donde auth.uid() es nulo), o si el usuario autenticado es admin.
    IF (auth.jwt() ->> 'role') = 'service_role' 
       OR auth.uid() IS NULL 
       OR public.es_admin() THEN
        RETURN NEW;
    END IF;

    -- Si un usuario regular intenta alterar su propio rol
    IF NEW.rol IS DISTINCT FROM OLD.rol THEN
        RAISE EXCEPTION 'Operación denegada: No tienes privilegios para modificar el rol de usuario.';
    END IF;

    -- Si un usuario regular intenta alterar su estado activo
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
```

---

## 5. Autenticación y Ciclo de Vida de Roles (`003_auth.sql`)

### 5.1 Script de Integración de Autenticación (`003_auth.sql`)

```sql
-- ============================================================================
-- MIGRACIÓN 003: 003_auth.sql
-- Descripción: Trigger automático en auth.users para creación de perfil estudiantil
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
        'estudiante', -- Rol siempre forzado a estudiante para autorregistros
        '{}'::TEXT[],
        '{}'::TEXT[],
        true
    );
    RETURN NEW;
END;
$$;

-- Vincular al evento AFTER INSERT de Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

---

### 5.2 Flujo de Registro y Autenticación en Android
1. **Captura en Formulario:** El estudiante completa email institucional, contraseña, nombre completo, código universitario y carrera.
2. **Ejecución en Repositorio:**
   ```kotlin
   supabaseClient.auth.signUpWith(Email) {
       this.email = emailInput
       this.password = passwordInput
       this.data = buildJsonObject {
           put("nombre", nombreInput)
           put("codigo_estudiante", codigoInput)
           put("carrera", carreraInput)
       }
   }
   ```
3. **Efecto Transaccional:** `auth.users` registra al usuario; el trigger `handle_new_user()` crea inmediatamente el registro correspondiente en `public.profiles` con `rol = 'estudiante'`.
4. **Persistencia de Sesión:** `supabase-kt` almacena el token JWT de forma segura en las preferencias de la app móvil.

---

### 5.3 Flujo de Inicio de Sesión y Middleware de Protección en Next.js
1. **Login Web:** Los usuarios ingresan con email y contraseña.
2. **Evaluación de Acceso en `middleware.ts`:**
   - Extrae el token de la cookie de sesión mediante `createServerClient` de `@supabase/ssr`.
   - Consulta el rol del usuario en `public.profiles`.
   - Si no está autenticado $\rightarrow$ Redirige a `/login`.
   - Si el rol es `estudiante` $\rightarrow$ Destruye la cookie y redirige a `/unauthorized` (los estudiantes solo deben usar la App Android).
   - Si el rol es `cocina` y pretende acceder a `/usuarios` o `/platos` $\rightarrow$ Redirige a `/dashboard` o `/pedidos` con mensaje de permiso denegado.
   - Si el rol es `admin` $\rightarrow$ Acceso permitido a todas las rutas.

---

### 5.4 Inicialización del Primer Administrador (Procedimiento SQL)
Al desplegar por primera vez el proyecto en Supabase:
1. El arquitecto o encargado se registra normalmente en Supabase Auth con su correo (ej: `admin@campussabor.edu.pe`).
2. Se ejecuta la siguiente consulta en el **SQL Editor** de Supabase para promoverlo:
```sql
-- Elevar al usuario a Administrador maestro
UPDATE public.profiles
SET rol = 'admin'
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin@campussabor.edu.pe'
);

-- Verificación inmediata
SELECT id, nombre, rol, activo 
FROM public.profiles 
WHERE rol = 'admin';
```

---

## 6. Especificación de Pantallas y Experiencia de Usuario

### 6.1 Pantallas de la App Android (Estudiantes)

| Pantalla | Ruta / Destino Compose | Rol | Componentes Principales de UI | Acciones e Interacciones con Backend |
| :--- | :--- | :--- | :--- | :--- |
| **Splash** | `splash` | Todos | Logo animado, spinner, comprobación de estado de autenticación. | Verifica token persistido en `supabase-kt`. Redirige a `menu_dia` si está activo, o a `login`. |
| **Login** | `auth/login` | Público | Campos de email, password, botón "Ingresar", botón de enlace a registro. | `supabase.auth.signInWith(Email)`. Carga perfil en `StateFlow` y navega a `menu_dia`. |
| **Registro** | `auth/register` | Público | Formulario: Nombre, Código Estudiante, Carrera, Email, Contraseña (con confirmación). | `supabase.auth.signUpWith(Email)` enviando metadatos. Valida código único. |
| **Menú del Día** | `menu_dia` | Estudiante | Header con fecha actual, selector de plato principal, tarjetas con foto, precio base, calorías y componentes. | Consulta `menu_dia` con join a `platos`. Muestra estado de porciones preparadas y botón "Armar Pedido". |
| **Armar Pedido** | `order_builder/{menuId}` | Estudiante | Selector visual de porción (`pequeña` $0.75\times$, `regular` $1.0\times$, `grande` $1.25\times$), chips para desmarcar componentes excluidos, dropdown de hora de recojo (12:00 a 15:00), tarjeta de total dinámico. | Valida hora límite. Inserta en `pedidos` con `menu_dia_id`, `porcion`, `componentes_excluidos`, `hora_recojo`. |
| **Mis Pedidos** | `my_orders` | Estudiante | Lista de órdenes históricas y activas con badges de estado (`pendiente`, `en_preparacion`, `listo`, `entregado`, `cancelado`), botón "Cancelar Pedido". | Consulta `pedidos` con filtro `estudiante_id = auth.uid()`. Permite cancelar si `estado == 'pendiente'`. |
| **Perfil** | `profile` | Estudiante | Tarjeta de datos de estudiante, chips de preferencias dietéticas (vegetariano, bajo en sodio), restricciones (alergias), botón "Cerrar Sesión". | Actualiza arrays `preferencias` y `restricciones` en `profiles`. `supabase.auth.signOut()`. |

---

### 6.2 Pantallas del Portal Web Administrativo (Next.js)

| Pantalla | Ruta App Router | Roles Permitidos | Componentes Principales de UI | Funcionalidades y Acciones |
| :--- | :--- | :--- | :--- | :--- |
| **Login** | `/login` | Todos | Card centralizada, input email/password, submit con feedback de carga y error. | Server Action `loginAction` autentica con `@supabase/ssr` y valida rol en `profiles`. |
| **Dashboard** | `/dashboard` | `cocina`, `admin` | Tarjetas KPI (pedidos activos, total recaudado estimado), gráficos de demanda por porción, tabla consolidada de `demanda_dia`. | Consulta la vista `demanda_dia` con filtros por fecha actual y exportación de resumen para cocina. |
| **Usuarios** | `/usuarios` | `admin` | Barra de búsqueda, filtro por rol (`estudiante`, `cocina`, `admin`), tabla paginada, modal para crear nuevo miembro de cocina/admin, toggle activar/desactivar, botón eliminar. | Server Actions en `usuarios/actions.ts`: `crearUsuarioStaff`, `cambiarRolUsuario`, `toggleEstadoUsuario`, `eliminarUsuario`. |
| **Platos** | `/platos` | `admin` | Grid de platos, botón "Nuevo Plato", modal de formulario con validación Zod (código, nombre, descripción, componentes, precio, calorías, subida de foto). | CRUD completo de platos sobre tabla `platos`. Desactivación lógica de platos. |
| **Menú del Día** | `/menu` | `cocina`, `admin` | Selector de calendario, selector de platos activos para el almuerzo del día, input de `cantidad_preparada`. | `admin`: vincula platos a fechas en `menu_dia`. `cocina`: actualiza en vivo `cantidad_preparada`. |
| **Pedidos** | `/pedidos` | `cocina`, `admin` | Tablero Kanban o lista tabular en tiempo real: columnas por estado (`pendiente`, `en_preparacion`, `listo`, `entregado`, `cancelado`). | Actualiza columna `estado` en `pedidos`. Muestra número de orden, estudiante, porción e ingredientes excluidos. |

---

## 7. Estructura de Proyectos y Dependencias

### 7.1 Estructura del Proyecto Android (`CampusSaborApp`)
```text
CampusSaborApp/
├── build.gradle.kts (Project root)
├── settings.gradle.kts
└── app/
    ├── build.gradle.kts
    └── src/
        └── main/
            ├── AndroidManifest.xml
            └── java/pe/campussabor/app/
                ├── CampusSaborApplication.kt
                ├── data/
                │   ├── model/
                │   │   ├── ProfileDto.kt
                │   │   ├── PlatoDto.kt
                │   │   ├── MenuDiaDto.kt
                │   │   └── PedidoDto.kt
                │   ├── remote/
                │   │   ├── SupabaseAuthService.kt
                │   │   └── SupabasePostgrestService.kt
                │   └── repository/
                │       ├── AuthRepositoryImpl.kt
                │       ├── MenuRepositoryImpl.kt
                │       └── OrderRepositoryImpl.kt
                ├── domain/
                │   ├── model/
                │   │   ├── UserProfile.kt
                │   │   ├── Dish.kt
                │   │   ├── DailyMenu.kt
                │   │   └── Order.kt
                │   ├── repository/
                │   │   ├── AuthRepository.kt
                │   │   ├── MenuRepository.kt
                │   │   └── OrderRepository.kt
                │   └── usecase/
                │       ├── GetTodayMenuUseCase.kt
                │       ├── CreateOrderUseCase.kt
                │       ├── CancelOrderUseCase.kt
                │       └── GetUserOrdersUseCase.kt
                ├── di/
                │   ├── SupabaseModule.kt
                │   ├── RepositoryModule.kt
                │   └── DispatcherModule.kt
                └── ui/
                    ├── MainActivity.kt
                    ├── theme/
                    │   ├── Color.kt
                    │   ├── Theme.kt
                    │   └── Type.kt
                    ├── navigation/
                    │   ├── Screen.kt
                    │   └── AppNavHost.kt
                    ├── screens/
                    │   ├── splash/
                    │   │   ├── SplashScreen.kt
                    │   │   └── SplashViewModel.kt
                    │   ├── auth/
                    │   │   ├── LoginScreen.kt
                    │   │   ├── RegisterScreen.kt
                    │   │   └── AuthViewModel.kt
                    │   ├── menu/
                    │   │   ├── MenuScreen.kt
                    │   │   └── MenuViewModel.kt
                    │   ├── order/
                    │   │   ├── OrderBuilderScreen.kt
                    │   │   └── OrderBuilderViewModel.kt
                    │   ├── orders/
                    │   │   ├── MyOrdersScreen.kt
                    │   │   └── MyOrdersViewModel.kt
                    │   └── profile/
                    │       ├── ProfileScreen.kt
                    │       └── ProfileViewModel.kt
                    └── components/
                        ├── CampusTopAppBar.kt
                        ├── PortionSelector.kt
                        └── StatusBadge.kt
```

#### Fragmento `build.gradle.kts` (App Android)
```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.dagger.hilt.android)
    alias(libs.plugins.ksp)
}

android {
    namespace = "pe.campussabor.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "pe.campussabor.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Inyección de variables desde local.properties
        val properties = java.util.Properties()
        val localPropertiesFile = project.rootProject.file("local.properties")
        if (localPropertiesFile.exists()) {
            properties.load(localPropertiesFile.inputStream())
        }

        buildConfigField("String", "SUPABASE_URL", "\"${properties.getProperty("SUPABASE_URL", "")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${properties.getProperty("SUPABASE_ANON_KEY", "")}\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")

    // Navigation & Lifecycle
    implementation("androidx.navigation:navigation-compose:2.8.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.6")

    // Dagger Hilt
    implementation("com.google.dagger:hilt-android:2.52")
    ksp("com.google.dagger:hilt-android-compiler:2.52")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Supabase-kt BOM & Módulos
    val supabaseBom = platform("io.github.jan-tennert.supabase:bom:3.0.3")
    implementation(supabaseBom)
    implementation("io.github.jan-tennert.supabase:auth-kt")
    implementation("io.github.jan-tennert.supabase:postgrest-kt")
    
    // Ktor Engine (OkHttp para Android)
    implementation("io.ktor:ktor-client-okhttp:3.0.1")

    // KotlinX Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // Coil para carga de imágenes en Compose
    implementation("io.coil-kt:coil-compose:2.7.0")
}
```

---

### 7.2 Estructura del Proyecto Web Next.js (`campus-sabor-web`)
```text
campus-sabor-web/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .env.local
├── middleware.ts
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── unauthorized/
    │   │   └── page.tsx
    │   ├── (auth)/
    │   │   └── login/
    │   │       ├── page.tsx
    │   │       └── LoginForm.tsx
    │   └── (admin)/
    │       ├── layout.tsx
    │       ├── dashboard/
    │       │   └── page.tsx
    │       ├── usuarios/
    │       │   ├── page.tsx
    │       │   ├── actions.ts
    │       │   ├── UserTable.tsx
    │       │   └── CreateUserModal.tsx
    │       ├── platos/
    │       │   ├── page.tsx
    │       │   ├── actions.ts
    │       │   └── DishFormModal.tsx
    │       ├── menu/
    │       │   ├── page.tsx
    │       │   └── actions.ts
    │       └── pedidos/
    │           ├── page.tsx
    │           └── actions.ts
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx
    │   │   └── Modal.tsx
    │   └── layout/
    │       ├── Sidebar.tsx
    │       └── Navbar.tsx
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts      # createBrowserClient (@supabase/ssr)
    │   │   ├── server.ts      # createServerClient con cookies (@supabase/ssr)
    │   │   └── admin.ts       # createClient con service_role key (Servidor puro)
    │   └── validations/
    │       ├── user.schema.ts
    │       ├── dish.schema.ts
    │       └── order.schema.ts
    └── types/
        ├── database.types.ts
        └── domain.ts
```

#### Configuración de Clientes Supabase en Next.js
**`src/lib/supabase/client.ts` (Cliente de Navegador):**
```typescript
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**`src/lib/supabase/server.ts` (Cliente de Servidor con Cookies):**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método puede fallar si se llama desde Server Components de solo lectura
          }
        },
      },
    }
  );
}
```

**`src/lib/supabase/admin.ts` (Cliente Privilegiado - Solo Servidor):**
```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY no está definida en el entorno del servidor.');
}

// Este cliente NUNCA debe importarse en Client Components
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

#### Server Action Típica: `src/app/(admin)/usuarios/actions.ts`
```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(2),
  rol: z.enum(['cocina', 'admin']),
});

export async function crearUsuarioStaff(formData: FormData) {
  // 1. Validar autorización del invocador
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single();

  if (profile?.rol !== 'admin') {
    throw new Error('Solo los administradores pueden registrar personal');
  }

  // 2. Validar payload con Zod
  const parsed = CreateUserSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
    nombre: formData.get('nombre'),
    rol: formData.get('rol'),
  });

  // 3. Crear usuario usando el cliente Admin con service_role
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
    user_metadata: { nombre: parsed.nombre },
  });

  if (createError) throw new Error(createError.message);

  // 4. Actualizar su rol en profiles
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ rol: parsed.rol })
    .eq('id', newUser.user.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/usuarios');
  return { success: true };
}
```

---

## 8. Gestión de Variables de Entorno

| Variable | Entorno / Plataforma | Archivo de Configuración | Tipo de Exposición | Descripción y Nivel de Riesgo |
| :--- | :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Android App | `local.properties` | Pública en Binario | URL del proyecto Supabase (ej: `https://xyz.supabase.co`). Leída mediante `buildConfigField`. |
| `SUPABASE_ANON_KEY` | Android App | `local.properties` | Pública en Binario | Llave pública anónima de PostgREST. Segura para distribución; restringida por RLS. |
| `NEXT_PUBLIC_SUPABASE_URL` | Web Next.js | `.env.local` | Pública en Browser | Misma URL de Supabase para inicialización en el navegador y SSR. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web Next.js | `.env.local` | Pública en Browser | Llave anónima pública de PostgREST para clientes de navegador. |
| `SUPABASE_SERVICE_ROLE_KEY` | Web Next.js | `.env.local` | **CONFIDENCIAL (Servidor Puro)** | **CRÍTICA:** Permite saltarse todo RLS. **NUNCA DEBE LLEVAR EL PREFIJO `NEXT_PUBLIC_` NI COMPILARSE AL CLIENTE**. Solo presente en Node.js runtime / Vercel Environment Variables. |

> [!CAUTION]
> Si la variable `SUPABASE_SERVICE_ROLE_KEY` es expuesta accidentalmente en el frontend o en el repositorio Git, cualquier usuario podría leer y modificar la totalidad de la base de datos sin restricciones. Se debe incluir inmediatamente `.env.local` y `local.properties` en el archivo `.gitignore`.

---

## 9. Plan de Implementación por Fases

### Fase 0: Preparación y Gobernanza del Proyecto
- [ ] Inicializar repositorio Git común o repositorios desacoplados (`campus-sabor-android` y `campus-sabor-web`).
- [ ] Configurar `.gitignore` para omitir `local.properties`, `.env*.local`, `.gradle`, `/build` y `.next`.
- [ ] Crear el proyecto unificado en la consola de Supabase Cloud.
- [ ] Documentar y resguardar en un gestor seguro las credenciales maestras (`URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`).
*Terminado cuando:* Los proyectos base compilan localmente sin errores y están conectados al entorno de Supabase.

---

### Fase 1: Base de Datos, Triggers y Políticas de Seguridad
- [ ] Ejecutar la migración `001_esquema.sql` (enums, tablas, trigger de total y vista `demanda_dia`).
- [ ] Ejecutar la migración `002_rls.sql` (funciones security definer, políticas RLS y trigger de protección de rol).
- [ ] Ejecutar la migración `003_auth.sql` (trigger de nuevo usuario en `auth.users`).
- [ ] Crear 3 cuentas de prueba manuales: `estudiante1@test.com`, `estudiante2@test.com`, `cocina@test.com`.
- [ ] Promover mediante SQL manual el primer administrador (`admin@campussabor.edu.pe`).
- [ ] Ejecutar pruebas de aislamiento RLS: verificar que `estudiante1` no puede leer ni actualizar los pedidos de `estudiante2`.
- [ ] Verificar que si un estudiante intenta enviar `UPDATE profiles SET rol = 'admin'` la transacción es abortada por el trigger.
*Terminado cuando:* Las políticas RLS y los triggers rechazan operaciones no autorizadas y calculan automáticamente el total de los pedidos en tests de consola SQL.

---

### Fase 2: Portal Web - Login y Gestión de Usuarios
- [ ] Implementar `lib/supabase/client.ts`, `server.ts` y `admin.ts`.
- [ ] Crear la pantalla `/login` con Server Actions y control de errores.
- [ ] Configurar `middleware.ts` para denegar el acceso a usuarios anónimos y a usuarios con rol `estudiante`.
- [ ] Construir la interfaz de `/usuarios` con tabla de listado y filtros por rol.
- [ ] Implementar Server Action `crearUsuarioStaff` con validación Zod y llamada a `supabaseAdmin.auth.admin.createUser`.
- [ ] Implementar cambio de rol, suspensión (`activo = false`) y borrado de usuarios.
*Terminado cuando:* Un administrador puede iniciar sesión en la web, crear un usuario para el equipo de cocina y verificar que este no puede acceder al módulo de usuarios.

---

### Fase 3: Portal Web - Catálogo de Platos, Menú Diario, Pedidos y Dashboard
- [ ] Crear el módulo `/platos` con formulario modal (nombre, código, ingredientes, calorías, precio, subida de imagen).
- [ ] Crear el módulo `/menu` para calendarizar qué platos se ofrecen en la fecha y definir la cantidad preparada.
- [ ] Construir el módulo `/pedidos` con actualización en vivo del estado (`pendiente` $\rightarrow$ `en_preparacion` $\rightarrow$ `listo` $\rightarrow$ `entregado`).
- [ ] Implementar el panel `/dashboard` consumiendo la vista `demanda_dia` con resumen de porciones solicitadas.
*Terminado cuando:* La cocina puede ver en tiempo real el desglose de porciones (`pequena`, `regular`, `grande`) demandadas para el almuerzo del día.

---

### Fase 4: App Android - Autenticación, Registro y Sesión Persistente
- [ ] Configurar Dagger Hilt y el módulo `SupabaseModule` con `supabase-kt`.
- [ ] Construir pantalla de Splash con verificación reactiva del estado de sesión en `auth-kt`.
- [ ] Implementar pantalla de Login con validación de inputs y feedback de error.
- [ ] Implementar pantalla de Registro capturando nombre, código universitario y carrera en los metadatos de usuario.
- [ ] Verificar la creación automática del perfil en la tabla `profiles` mediante el trigger de base de datos.
*Terminado cuando:* Un estudiante nuevo puede registrarse en la app móvil, iniciar sesión y mantenerla abierta tras reiniciar la aplicación.

---

### Fase 5: App Android - Exploración del Menú y Creación de Pedidos
- [ ] Implementar `MenuViewModel` y pantalla de Menú del Día consumiendo `menu_dia` con join a `platos`.
- [ ] Diseñar el flujo de "Armar Pedido":
  - Componente de selección interactiva de porción (chips para `pequena`, `regular`, `grande` con cálculo visual de precio).
  - Filtro dinámico de componentes para permitir al estudiante desmarcar ingredientes no deseados.
  - Selector de horario de recogida (intervalos de 15 minutos).
- [ ] Conectar la acción de confirmar pedido insertando en `pedidos`.
- [ ] Validar que el servidor calcula y asigna el `total` correcto sin importar lo enviado por el cliente.
*Terminado cuando:* Un estudiante puede armar y confirmar su pedido personalizado, visualizándose inmediatamente en el panel web de la cocina.

---

### Fase 6: App Android - Mis Pedidos, Perfil y Resiliencia
- [ ] Implementar pantalla `Mis Pedidos` agrupando pedidos activos y pasados.
- [ ] Implementar botón de cancelación con validación de estado (`pendiente`).
- [ ] Diseñar pantalla de Perfil permitiendo modificar preferencias (ej: vegetariano) y restricciones alimentarias.
- [ ] Añadir manejo global de errores de conectividad y estados vacíos (*Empty States*).
*Terminado cuando:* El estudiante puede cancelar un pedido antes de su preparación y actualizar sus preferencias alimenticias.

---

### Fase 7: Pruebas de Punta a Punta, Compilación APK y Despliegue Web
- [ ] Realizar prueba integral de flujo: Estudiante pide en Android $\rightarrow$ Cocina visualiza en Dashboard y cambia a `en_preparacion` y `listo` $\rightarrow$ Estudiante ve el cambio de estado en Mis Pedidos $\rightarrow$ Entrega en caja.
- [ ] Generar APK Release firmado de la App Android para pruebas internas.
- [ ] Configurar variables de entorno y desplegar el portal web en Vercel.
- [ ] Auditoría de seguridad: revisar que `service_role` no esté en clientes y verificar logs de RLS.
*Terminado cuando:* La web está online en producción en Vercel y el APK corre fluidamente en dispositivos Android físicos.

---

### Visión Posterior al MVP (Versión 2)
1. **Predicción de Demanda con Inteligencia Artificial:** Modelo predictivo que estima la demanda de comensales por día según clima, día de la semana y calendario de exámenes.
2. **Recomendador Nutricional de Porción:** Sugerencia inteligente de porción basada en carrera, horario de clases y objetivos nutricionales del estudiante.
3. **Pasarela de Pagos Digital:** Integración de cobros en app (Yape, Plin y tarjetas) para evitar colas en la caja física.
4. **Métricas de Impacto Ambiental:** Panel que cuantifica los kilogramos de comida salvados y la huella de carbono reducida gracias a la plataforma.

---

## 10. Matriz de Riesgos y Decisiones Pendientes

### 10.1 Matriz de Riesgos y Mitigación

| Riesgo Identificado | Nivel de Severidad | Probabilidad | Estrategia Concreta de Mitigación |
| :--- | :--- | :--- | :--- |
| **Filtración de `SUPABASE_SERVICE_ROLE_KEY`** | **Catastrófica** | Baja | Restringir su uso estrictamente a `lib/supabase/admin.ts`. Excluirla de variables de entorno de cliente (`NEXT_PUBLIC_`) y añadir escaneo automatizado de secretos en commits de Git. |
| **Vulnerabilidad o recursión infinita en políticas RLS** | **Alta** | Media | Emplear funciones `SECURITY DEFINER` (`mi_rol()`, `es_admin()`, `es_staff()`) con `SET search_path = public` para evaluar roles sin disparar consultas circulares en `profiles`. |
| **Baja tasa de adopción por parte de los estudiantes** | **Media** | Media | Campaña de comunicación del comedor universitario ofreciendo descuento o prioridad en la fila a quienes reserven con antelación desde la app. |
| **Pedidos abandonados (No-Show sin pago previo)** | **Alta** | Media | Política de penalización en la app: tras 2 pedidos no recogidos, la cuenta queda temporalmente suspendida para reservar con antelación hasta regularizar en caja. |
| **Desfase de versiones Ktor / Supabase-kt en Android** | **Media** | Baja | Fijar las versiones mediante el BOM oficial de Supabase (`3.0.3`) y el motor probado `ktor-client-okhttp:3.0.1`. |

---

### 10.2 Checklist de Decisiones de Negocio y Técnicas Pendientes

- [ ] **Hora de corte para pedidos del día:** Determinar si el límite será las 10:30 AM o las 11:00 AM para darle suficiente margen de cocción al equipo de cocina.
- [ ] **Ajuste de multiplicadores de porción:** Confirmar con el área de nutrición si los factores $0.75\times$, $1.00\times$ y $1.25\times$ corresponden efectivamente al gramaje servido.
- [ ] **Catálogo cerrado de alérgenos:** Decidir si las restricciones médicas/alergias se eligen de una lista fija estandarizada o si se permite texto libre.
- [ ] **Verificación de correo institucional:** Definir si el registro requiere forzosamente dominio universitario (`@unmsm.edu.pe`, `@uni.edu.pe`, etc.) o confirmación por link de correo.
- [ ] **Validación de padrón de estudiantes:** Decidir si en v1 basta con registrar el código como texto único o si debe cruzarse contra una lista oficial de matriculados activos.
