# Campus Sabor - AI Demand Forecasting Engine 🧠🍽️

Motor de Machine Learning para predecir la demanda anticipada de platos y la distribución de porciones (`pequena`, `regular`, `grande`) en el comedor universitario.

---

## 1. Problema de Negocio que Resuelve
En comedores universitarios, la falta de información previa genera mermas del **15% al 30%** de comida preparada. Este motor de IA reemplaza las hojas de cálculo manuales y la intuición de la cocina con **estimaciones precisas basadas en datos**.

## 2. Arquitectura del Modelo
- **Algoritmo:** `MultiOutputRegressor(RandomForestRegressor)` con 120 estimadores y regularización anti-overfitting.
- **Variables de Entrada (Features):**
  - Temporales: `dia_semana`, `es_inicio_semana`, `es_viernes`.
  - Calendario Académico: `es_examenes` (semanas de exámenes parciales/finales).
  - Nutricionales y de Menú: `precio`, `calorias`, `categoria` (carne, pollo, vegetariano), One-Hot Encoding del plato.
- **Variables Predichas (Multi-Output Targets):**
  1. `cantidad_pequena` (Porción 0.75×)
  2. `cantidad_regular` (Porción 1.00×)
  3. `cantidad_grande`  (Porción 1.25×)
  4. `cantidad_total`   (Total de raciones del plato)

## 3. Métricas de Rendimiento en Conjunto de Prueba
- **$R^2$ Score Total:** `0.745` (explica ~75% de la varianza en la demanda real).
- **Error Absoluto Medio (MAE):**
  - Ración Pequeña: `± 2.37` raciones
  - Ración Regular: `± 5.41` raciones
  - Ración Grande:  `± 2.69` raciones
  - Total por Plato: `± 9.11` raciones

## 4. Ejecución del Servicio

### A. Generar Dataset Sintético
```bash
python ai_engine/generate_dataset.py
```

### B. Entrenar y Serializar Modelo
```bash
python ai_engine/train_model.py
```

### C. Iniciar API REST de Inferencia con FastAPI
```bash
uvicorn ai_engine.main:app --host 0.0.0.0 --port 8000 --reload
```
Documentación interactiva disponible en: `http://localhost:8000/docs`.
