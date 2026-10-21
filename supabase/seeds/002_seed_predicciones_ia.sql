-- ============================================================================
-- SEMILLAS DE PRUEBA: 002_seed_predicciones_ia.sql
-- Proyecto: Campus Sabor
-- Descripción: Inserción de predicciones de demanda calculadas por el modelo de IA
--              para el menú de hoy y mañana
-- ============================================================================

-- 1. Predicciones para HOY (PL-001, PL-002, PL-005)
-- Lomo Saltado Universitario (PL-001)
INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE,
    id,
    'pequena'::public.tamano_porcion,
    26,
    0.920,
    '{"modelo": "RandomForest_MultiOutput", "calorias": 750, "factor_dia": 1.08, "recomendacion": "Prever 26 raciones pequeñas para estudiantes con menor apetito"}'::jsonb
FROM public.platos WHERE codigo = 'PL-001'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE,
    id,
    'regular'::public.tamano_porcion,
    67,
    0.920,
    '{"modelo": "RandomForest_MultiOutput", "calorias": 750, "factor_dia": 1.08}'::jsonb
FROM public.platos WHERE codigo = 'PL-001'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE,
    id,
    'grande'::public.tamano_porcion,
    24,
    0.920,
    '{"modelo": "RandomForest_MultiOutput", "calorias": 750, "factor_dia": 1.08}'::jsonb
FROM public.platos WHERE codigo = 'PL-001'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

-- Ají de Gallina Tradicional (PL-002)
INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE,
    id,
    'pequena'::public.tamano_porcion,
    20,
    0.910,
    '{"modelo": "RandomForest_MultiOutput", "calorias": 680}'::jsonb
FROM public.platos WHERE codigo = 'PL-002'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE,
    id,
    'regular'::public.tamano_porcion,
    53,
    0.910,
    '{"modelo": "RandomForest_MultiOutput", "calorias": 680}'::jsonb
FROM public.platos WHERE codigo = 'PL-002'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE,
    id,
    'grande'::public.tamano_porcion,
    21,
    0.910,
    '{"modelo": "RandomForest_MultiOutput", "calorias": 680}'::jsonb
FROM public.platos WHERE codigo = 'PL-002'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

-- Estofado de Lentejas (PL-005)
INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE,
    id,
    'pequena'::public.tamano_porcion,
    14,
    0.880,
    '{"modelo": "RandomForest_MultiOutput", "calorias": 510}'::jsonb
FROM public.platos WHERE codigo = 'PL-005'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE,
    id,
    'regular'::public.tamano_porcion,
    38,
    0.880,
    '{"modelo": "RandomForest_MultiOutput", "calorias": 510}'::jsonb
FROM public.platos WHERE codigo = 'PL-005'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE,
    id,
    'grande'::public.tamano_porcion,
    14,
    0.880,
    '{"modelo": "RandomForest_MultiOutput", "calorias": 510}'::jsonb
FROM public.platos WHERE codigo = 'PL-005'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

-- 2. Predicciones para MAÑANA (PL-003, PL-004)
-- Seco de Res (PL-003)
INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE + INTERVAL '1 day',
    id,
    'pequena'::public.tamano_porcion,
    18,
    0.900,
    '{"modelo": "RandomForest_MultiOutput"}'::jsonb
FROM public.platos WHERE codigo = 'PL-003'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE + INTERVAL '1 day',
    id,
    'regular'::public.tamano_porcion,
    50,
    0.900,
    '{"modelo": "RandomForest_MultiOutput"}'::jsonb
FROM public.platos WHERE codigo = 'PL-003'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE + INTERVAL '1 day',
    id,
    'grande'::public.tamano_porcion,
    19,
    0.900,
    '{"modelo": "RandomForest_MultiOutput"}'::jsonb
FROM public.platos WHERE codigo = 'PL-003'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

-- Milanesa de Pollo (PL-004)
INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE + INTERVAL '1 day',
    id,
    'pequena'::public.tamano_porcion,
    22,
    0.920,
    '{"modelo": "RandomForest_MultiOutput"}'::jsonb
FROM public.platos WHERE codigo = 'PL-004'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE + INTERVAL '1 day',
    id,
    'regular'::public.tamano_porcion,
    60,
    0.920,
    '{"modelo": "RandomForest_MultiOutput"}'::jsonb
FROM public.platos WHERE codigo = 'PL-004'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();

INSERT INTO public.predicciones_demanda (fecha, plato_id, porcion, cantidad_predicha, confianza_score, metadatos)
SELECT 
    CURRENT_DATE + INTERVAL '1 day',
    id,
    'grande'::public.tamano_porcion,
    23,
    0.920,
    '{"modelo": "RandomForest_MultiOutput"}'::jsonb
FROM public.platos WHERE codigo = 'PL-004'
ON CONFLICT (fecha, plato_id, porcion) DO UPDATE 
SET cantidad_predicha = EXCLUDED.cantidad_predicha, confianza_score = EXCLUDED.confianza_score, updated_at = now();
