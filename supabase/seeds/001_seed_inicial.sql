-- ============================================================================
-- SEMILLAS DE PRUEBA: 001_seed_inicial.sql
-- Proyecto: Campus Sabor
-- Descripción: Datos base de platos típicos del comedor y menú del día
-- ============================================================================

-- 1. Insertar platos en el catálogo
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

-- 2. Vincular platos al menú del día de hoy y mañana
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
