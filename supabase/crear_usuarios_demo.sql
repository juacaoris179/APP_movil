-- ============================================================================
-- SCRIPT: crear_usuarios_demo.sql
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
SET search_path = public, extensions, auth;

-- 1. Limpiar usuarios previos si existieran para evitar colisiones
DELETE FROM auth.users 
WHERE email IN (
    'estudiante@campussabor.pe', 
    'admin@campussabor.pe', 
    'jucaoris@ejemplo.com'
);

-- 2. Crear usuario ESTUDIANTE para la App Móvil
-- Correo: estudiante@campussabor.pe | Clave: estudiante123
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'estudiante@campussabor.pe',
    extensions.crypt('estudiante123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Pedro Perez","codigo_estudiante":"20241050","carrera":"Ingenieria Industrial"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 3. Crear usuario ADMINISTRADOR para el Panel Web
-- Correo: admin@campussabor.pe | Clave: admin123
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@campussabor.pe',
    extensions.crypt('admin123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Administrador General","codigo_estudiante":"ADM-01","carrera":"Administracion"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 4. Crear usuario ADMINISTRADOR con tu correo
-- Correo: jucaoris@ejemplo.com | Clave: admin123
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'jucaoris@ejemplo.com',
    extensions.crypt('admin123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nombre":"Admin Juancao","codigo_estudiante":"ADM-02","carrera":"Sistemas"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 5. Asignar rol de admin en profiles
UPDATE public.profiles
SET rol = 'admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email IN ('admin@campussabor.pe', 'jucaoris@ejemplo.com')
);
