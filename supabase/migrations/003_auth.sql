-- ============================================================================
-- MIGRACIÓN 003: 003_auth.sql
-- Proyecto: Campus Sabor
-- Descripción: Creación de trigger para alta de perfiles en auth.users y procedimiento de primer admin
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRIGGER AFTER INSERT EN auth.users
-- ----------------------------------------------------------------------------
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
        'estudiante', -- Rol siempre forzado a 'estudiante' para autorregistros públicos
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

-- ----------------------------------------------------------------------------
-- 2. PROCEDIMIENTO PARA EL PRIMER ADMINISTRADOR
-- ----------------------------------------------------------------------------
/*
INSTRUCCIONES PARA INICIALIZAR EL PRIMER ADMINISTRADOR:
Una vez que el primer usuario administrador se haya registrado en Supabase Auth
(vía aplicación o panel de Supabase con su correo institucional, ej: admin@campussabor.edu.pe),
ejecuta la siguiente sentencia en el SQL Editor de Supabase:

UPDATE public.profiles
SET rol = 'admin'
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin@campussabor.edu.pe'
);

-- Verificar que el rol se actualizó correctamente:
SELECT id, nombre, rol, activo, created_at
FROM public.profiles
WHERE rol = 'admin';
*/
