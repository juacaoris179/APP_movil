-- ============================================================================
-- MIGRACIÓN 004: 004_predicciones.sql
-- Descripción: Tabla de predicciones de demanda generadas por el modelo de IA
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

COMMENT ON TABLE public.predicciones_demanda IS 'Estimaciones generadas por el modelo de Machine Learning de Campus Sabor para planificación de cocina.';

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_predicciones_fecha ON public.predicciones_demanda(fecha);
CREATE INDEX IF NOT EXISTS idx_predicciones_plato ON public.predicciones_demanda(plato_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.predicciones_demanda ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- 1. Staff (Cocina y Administradores) pueden ver todas las predicciones
CREATE POLICY predicciones_leer ON public.predicciones_demanda FOR SELECT
    USING (public.es_staff());

-- 2. Administradores o personal autorizado pueden insertar y actualizar predicciones
CREATE POLICY predicciones_insertar ON public.predicciones_demanda FOR INSERT
    WITH CHECK (public.es_staff());

CREATE POLICY predicciones_actualizar ON public.predicciones_demanda FOR UPDATE
    USING (public.es_staff())
    WITH CHECK (public.es_staff());

CREATE POLICY predicciones_eliminar ON public.predicciones_demanda FOR DELETE
    USING (public.es_admin());
