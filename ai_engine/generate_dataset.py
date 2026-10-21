"""
Generador de Dataset Histórico de Demanda - Campus Sabor
Simula 120 días hábiles (aprox. 6 meses académicos) de operaciones del comedor universitario
considerando factores de negocio reales: estacionalidad semanal, popularidad de platos,
semanas de exámenes parciales/finales y distribución de porciones.
"""

import os
import random
from datetime import date, timedelta
import pandas as pd
import numpy as np

# Configurar semilla para reproducibilidad
np.random.seed(42)
random.seed(42)

# Catálogo maestro de platos (alineado con la base de datos Supabase)
PLATOS_CATALOGO = [
    {
        "codigo": "PL-001",
        "nombre": "Lomo Saltado Universitario",
        "precio": 12.00,
        "calorias": 750,
        "peso_popularidad": 1.30,
        "categoria": "carne",
    },
    {
        "codigo": "PL-002",
        "nombre": "Ají de Gallina Tradicional",
        "precio": 10.00,
        "calorias": 680,
        "peso_popularidad": 1.00,
        "categoria": "pollo",
    },
    {
        "codigo": "PL-003",
        "nombre": "Seco de Res con Frejoles",
        "precio": 11.50,
        "calorias": 820,
        "peso_popularidad": 0.95,
        "categoria": "carne",
    },
    {
        "codigo": "PL-004",
        "nombre": "Milanesa de Pollo con Ensalada Fresca",
        "precio": 10.50,
        "calorias": 620,
        "peso_popularidad": 1.15,
        "categoria": "pollo",
    },
    {
        "codigo": "PL-005",
        "nombre": "Estofado de Lentejas Campestre (Opción Vegetariana)",
        "precio": 8.50,
        "calorias": 510,
        "peso_popularidad": 0.65,
        "categoria": "vegetariano",
    },
]

# Días de la semana hábiles y factores multiplicadores de afluencia
DIAS_SEMANA = {
    0: ("Lunes", 1.05),
    1: ("Martes", 1.12),
    2: ("Miércoles", 1.08),
    3: ("Jueves", 0.98),
    4: ("Viernes", 0.77),
}

def generar_historico(dias_habiles=120, fecha_fin=None):
    if fecha_fin is None:
        fecha_fin = date(2026, 10, 20)

    registros = []
    fecha_actual = fecha_fin
    dias_generados = 0

    while dias_generados < dias_habiles:
        # Solo días de semana (Lunes a Viernes)
        if fecha_actual.weekday() < 5:
            dias_generados += 1
            dia_num = fecha_actual.weekday()
            dia_nombre, factor_dia = DIAS_SEMANA[dia_num]

            # Simular semanas de exámenes (semana 7-8 y semana 15-16 del ciclo)
            # Aproximadamente cada 8 semanas
            semana_ciclo = (dias_generados // 5) % 16 + 1
            es_examenes = 1 if semana_ciclo in (7, 8, 15, 16) else 0
            factor_examenes = 0.85 if es_examenes else 1.00

            # Base diaria de comensales totales en el comedor (entre 190 y 250 raciones)
            base_total = random.uniform(195, 240) * factor_dia * factor_examenes

            # Seleccionar entre 2 y 3 platos para el menú del día
            # Siempre se procura tener al menos 1 de carne/pollo y opcional vegetariano
            num_platos = 3 if dia_num in (1, 2) else 2
            platos_dia = random.sample(PLATOS_CATALOGO, k=num_platos)

            # Distribuir demanda entre los platos ofertados según peso de popularidad
            suma_pesos = sum(p["peso_popularidad"] for p in platos_dia)

            for p in platos_dia:
                proporcion_plato = p["peso_popularidad"] / suma_pesos
                total_plato = int(round(base_total * proporcion_plato + np.random.normal(0, 3)))
                total_plato = max(total_plato, 15)  # Mínimo 15 pedidos

                # Distribución de porciones:
                # - Pequeña: 22% (0.75x)
                # - Regular: 58% (1.00x)
                # - Grande:  20% (1.25x)
                # En días de exámenes sube un poco la porción regular
                p_pequena = 0.20 if es_examenes else 0.23
                p_grande = 0.18 if dia_num == 4 else 0.21
                p_regular = 1.0 - (p_pequena + p_grande)

                cant_pequena = int(round(total_plato * p_pequena + np.random.normal(0, 1.5)))
                cant_grande = int(round(total_plato * p_grande + np.random.normal(0, 1.5)))
                cant_pequena = max(cant_pequena, 2)
                cant_grande = max(cant_grande, 2)
                cant_regular = max(total_plato - (cant_pequena + cant_grande), 5)
                total_real = cant_pequena + cant_regular + cant_grande

                registros.append({
                    "fecha": fecha_actual.isoformat(),
                    "plato_codigo": p["codigo"],
                    "plato_nombre": p["nombre"],
                    "categoria": p["categoria"],
                    "precio": p["precio"],
                    "calorias": p["calorias"],
                    "dia_semana": dia_num,
                    "dia_semana_nombre": dia_nombre,
                    "es_examenes": es_examenes,
                    "cantidad_pequena": cant_pequena,
                    "cantidad_regular": cant_regular,
                    "cantidad_grande": cant_grande,
                    "cantidad_total": total_real,
                })

        fecha_actual -= timedelta(days=1)

    df = pd.DataFrame(registros)
    # Ordenar cronológicamente ascendente
    df = df.sort_values(by=["fecha", "plato_codigo"]).reset_index(drop=True)
    return df

if __name__ == "__main__":
    os.makedirs("ai_engine/data", exist_ok=True)
    df = generar_historico(dias_habiles=120)
    output_path = "ai_engine/data/historico_demanda_comedor.csv"
    df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"Dataset generado con exito: {len(df)} filas.")
    print(f"Rango de fechas: {df['fecha'].min()} hasta {df['fecha'].max()}")
    print("\nPrimeras 5 filas:")
    print(df.head())
    print("\nResumen de demanda promedio por plato:")
    print(df.groupby("plato_nombre")[["cantidad_pequena", "cantidad_regular", "cantidad_grande", "cantidad_total"]].mean().round(1))
