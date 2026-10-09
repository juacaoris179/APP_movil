-- ============================================================================
-- SUITE DE PRUEBAS AUTOMATIZADAS SQL: 001_test_rls_y_seguridad.sql
-- Proyecto: Campus Sabor
-- Descripción: Verificación en base de datos de cálculos por porción, vista demanda y triggers
-- ============================================================================

DO $$
DECLARE
    v_plato_id UUID;
    v_menu_id UUID;
    v_estudiante_id UUID;
    v_pedido_id UUID;
    v_total_calculado NUMERIC(10,2);
    v_fecha_calculada DATE;
    v_demanda_conteo INTEGER;
BEGIN
    RAISE NOTICE '>>> INICIANDO SUITE DE PRUEBAS DE SEGURIDAD Y CÁLCULO <<<';

    -- 1. Crear usuario simulado en profiles para prueba
    v_estudiante_id := gen_random_uuid();
    INSERT INTO public.profiles (id, nombre, codigo_estudiante, carrera, rol)
    VALUES (v_estudiante_id, 'Estudiante Test', '20230001', 'Ingeniería de Sistemas', 'estudiante');

    -- 2. Crear plato de prueba con precio base 10.00
    INSERT INTO public.platos (codigo, nombre, precio, activo)
    VALUES ('PL-TEST', 'Plato de Prueba', 10.00, true)
    RETURNING id INTO v_plato_id;

    -- 3. Crear menú del día para hoy
    INSERT INTO public.menu_dia (fecha, plato_id, cantidad_preparada)
    VALUES (CURRENT_DATE, v_plato_id, 50)
    RETURNING id INTO v_menu_id;

    -- ------------------------------------------------------------------------
    -- TEST 1: Verificar cálculo de porción 'pequena' (Factor 0.75 => 7.50)
    -- Intentamos inyectar total = 1.00 para verificar que el trigger lo sobreescribe
    -- ------------------------------------------------------------------------
    INSERT INTO public.pedidos (estudiante_id, menu_dia_id, fecha, hora_recojo, porcion, total)
    VALUES (v_estudiante_id, v_menu_id, CURRENT_DATE - INTERVAL '5 days', '12:30:00', 'pequena', 1.00)
    RETURNING id, total, fecha INTO v_pedido_id, v_total_calculado, v_fecha_calculada;

    IF v_total_calculado <> 7.50 THEN
        RAISE EXCEPTION 'TEST 1 FALLÓ: El total para porción pequeña debía ser 7.50 pero dio %', v_total_calculado;
    END IF;
    IF v_fecha_calculada <> CURRENT_DATE THEN
        RAISE EXCEPTION 'TEST 1 FALLÓ: La fecha debía forzarse a la del menú (%) pero dio %', CURRENT_DATE, v_fecha_calculada;
    END IF;
    RAISE NOTICE 'TEST 1 PASÓ: Porción pequeña calculada correctamente (7.50) y fecha sincronizada.';

    -- ------------------------------------------------------------------------
    -- TEST 2: Verificar cálculo de porción 'grande' (Factor 1.25 => 12.50)
    -- ------------------------------------------------------------------------
    UPDATE public.pedidos
    SET porcion = 'grande'
    WHERE id = v_pedido_id
    RETURNING total INTO v_total_calculado;

    IF v_total_calculado <> 12.50 THEN
        RAISE EXCEPTION 'TEST 2 FALLÓ: El total tras cambio a grande debía ser 12.50 pero dio %', v_total_calculado;
    END IF;
    RAISE NOTICE 'TEST 2 PASÓ: Porción grande recalculada correctamente (12.50).';

    -- ------------------------------------------------------------------------
    -- TEST 3: Verificar que pedidos cancelados se excluyen de la vista demanda_dia
    -- ------------------------------------------------------------------------
    -- Pedido actualmente activo (grande: 1 pedido)
    SELECT COALESCE(SUM(total_pedidos), 0) INTO v_demanda_conteo
    FROM public.demanda_dia
    WHERE plato_id = v_plato_id;

    IF v_demanda_conteo <> 1 THEN
        RAISE EXCEPTION 'TEST 3 FALLÓ: Se esperaba 1 pedido en demanda_dia pero dio %', v_demanda_conteo;
    END IF;

    -- Cancelamos el pedido
    UPDATE public.pedidos SET estado = 'cancelado' WHERE id = v_pedido_id;

    SELECT COALESCE(SUM(total_pedidos), 0) INTO v_demanda_conteo
    FROM public.demanda_dia
    WHERE plato_id = v_plato_id;

    IF v_demanda_conteo <> 0 THEN
        RAISE EXCEPTION 'TEST 3 FALLÓ: Los pedidos cancelados no deben contarse en demanda_dia. Conteo: %', v_demanda_conteo;
    END IF;
    RAISE NOTICE 'TEST 3 PASÓ: Vista demanda_dia excluye pedidos cancelados correctamente.';

    -- Limpieza de datos de prueba
    DELETE FROM public.pedidos WHERE id = v_pedido_id;
    DELETE FROM public.menu_dia WHERE id = v_menu_id;
    DELETE FROM public.platos WHERE id = v_plato_id;
    DELETE FROM public.profiles WHERE id = v_estudiante_id;

    RAISE NOTICE '>>> TODAS LAS PRUEBAS SQL DE INTEGRIDAD Y CÁLCULO PASARON CON ÉXITO <<<';
END $$;
