"""
Entrenamiento del Modelo de Predicción de Demanda - Campus Sabor
Modelo: MultiOutput Regressor con Random Forest para estimar
la cantidad necesaria de porciones (pequeña, regular, grande) y total.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

DATA_PATH = "ai_engine/data/historico_demanda_comedor.csv"
MODEL_DIR = "ai_engine/models"

def preparar_features(df: pd.DataFrame):
    """
    Transforma variables crudas en características útiles para el modelo.
    """
    df = df.copy()

    # Features temporales y de calendario
    df["es_inicio_semana"] = df["dia_semana"].isin([0, 1]).astype(int)
    df["es_viernes"] = (df["dia_semana"] == 4).astype(int)

    # One-Hot Encoding de platos (códigos PL-001 a PL-005)
    plato_dummies = pd.get_dummies(df["plato_codigo"], prefix="plato", dtype=int)
    categoria_dummies = pd.get_dummies(df["categoria"], prefix="cat", dtype=int)

    # Concatenar
    X = pd.concat([
        df[["dia_semana", "es_inicio_semana", "es_viernes", "es_examenes", "precio", "calorias"]],
        plato_dummies,
        categoria_dummies
    ], axis=1)

    # Targets: [pequeña, regular, grande, total]
    Y = df[["cantidad_pequena", "cantidad_regular", "cantidad_grande", "cantidad_total"]]

    return X, Y, list(X.columns)

def entrenar():
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("Cargando dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"Total registros: {len(df)}")

    X, Y, feature_cols = preparar_features(df)

    # División temporal (80% entrenamiento, 20% prueba para respetar causalidad temporal)
    split_idx = int(len(df) * 0.80)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    Y_train, Y_test = Y.iloc[:split_idx], Y.iloc[split_idx:]

    print(f"Entrenamiento: {len(X_train)} filas | Test: {len(X_test)} filas")

    # Estimador base: Random Forest con regularización para evitar overfitting
    base_rf = RandomForestRegressor(
        n_estimators=120,
        max_depth=6,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42
    )
    multi_model = MultiOutputRegressor(base_rf)

    print("Entrenando modelo MultiOutput Random Forest...")
    multi_model.fit(X_train, Y_train)

    # Evaluación en conjunto de prueba
    Y_pred = multi_model.predict(X_test)
    Y_pred_df = pd.DataFrame(Y_pred, columns=Y.columns, index=Y_test.index)

    # Métricas
    metricas = {}
    print("\n================ RESULTADOS DE EVALUACIÓN (TEST SET) ================")
    for col in Y.columns:
        mae = mean_absolute_error(Y_test[col], Y_pred_df[col])
        rmse = np.sqrt(mean_squared_error(Y_test[col], Y_pred_df[col]))
        r2 = r2_score(Y_test[col], Y_pred_df[col])
        metricas[col] = {
            "MAE": round(float(mae), 2),
            "RMSE": round(float(rmse), 2),
            "R2": round(float(r2), 4)
        }
        print(f"[{col}] -> MAE: {mae:.2f} raciones | RMSE: {rmse:.2f} | R²: {r2:.4f}")
    print("====================================================================\n")

    # Guardar modelo entrenado
    model_file = os.path.join(MODEL_DIR, "demand_model.joblib")
    joblib.dump(multi_model, model_file)
    print(f"Modelo guardado en: {model_file}")

    # Guardar metadatos y features esperadas
    metadata = {
        "version": "1.0.0",
        "fecha_entrenamiento": datetime.now().isoformat(),
        "algoritmo": "MultiOutputRegressor(RandomForestRegressor)",
        "features": feature_cols,
        "targets": list(Y.columns),
        "metricas": metricas,
        "ejemplo_mae_total": metricas["cantidad_total"]["MAE"],
        "precision_promedio_raciones": f"Error menor a +/- {metricas['cantidad_total']['MAE']} raciones"
    }

    metadata_file = os.path.join(MODEL_DIR, "model_metadata.json")
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"Metadatos guardados en: {metadata_file}")

if __name__ == "__main__":
    entrenar()
