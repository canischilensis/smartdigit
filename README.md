# SmartDigit — CNN de reconocimiento de dígitos servida por API en Docker

Clasificador de dígitos manuscritos (MNIST) empaquetado en un contenedor Docker,
expuesto por una API REST en Django y consumido desde una interfaz de dibujo en
HTML5 Canvas.

El foco del proyecto no es el modelo —MNIST es un dataset de referencia
resuelto— sino el paso de **notebook a servicio ejecutable**: paridad de
entornos entre entrenamiento e inferencia, serialización estable del artefacto y
contrato explícito entre frontend y API.

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)
![Keras](https://img.shields.io/badge/Keras-D00000?style=flat-square&logo=keras&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=flat-square&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/Django_REST_Framework-ff1709?style=flat-square&logo=django&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white)
![Pillow](https://img.shields.io/badge/Pillow-6C63FF?style=flat-square&logo=python&logoColor=white)

---

## Índice

1. [Alcance y limitaciones](#alcance-y-limitaciones)
2. [Resultados](#resultados)
3. [Arquitectura](#arquitectura)
4. [Modelo](#modelo)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Puesta en marcha](#puesta-en-marcha)
7. [Contrato de la API](#contrato-de-la-api)
8. [Postmortem: notebook → contenedor](#postmortem-notebook--contenedor)
9. [Evolución del proyecto](#evolución-del-proyecto)
10. [Trabajo pendiente](#trabajo-pendiente)

---

## Alcance y limitaciones

Declarado por adelantado para evitar lecturas equivocadas:

- **MNIST es un dataset de referencia**, no un problema de negocio. El valor de
  este repositorio está en la ingeniería de despliegue, no en el desempeño del
  clasificador.
- **No está desplegado en ningún entorno público.** Corre en local con Docker
  Compose.
- **No hay monitoreo, reentrenamiento ni versionado automático de modelos.**
  MLflow no está integrado.
- **Sin integración continua.** Los tests existentes se ejecutan a mano.
- La distribución de los trazos dibujados en el canvas **no es la misma** que la
  de MNIST (grosor, centrado, antialiasing). El preprocesamiento acorta esa
  distancia, pero no la elimina: el desempeño sobre trazos de usuario es menor
  que sobre el conjunto de prueba.

---

## Resultados

> **PENDIENTE DE COMPLETAR.** Los números salen del notebook de entrenamiento en
> `notebooks/`. Mientras esta tabla esté vacía, el repositorio no reporta
> desempeño.

| Métrica | Valor | Conjunto |
| --- | --- | --- |
| Accuracy | `PENDIENTE` | Test MNIST (10.000 imágenes) |
| Accuracy | `PENDIENTE` | Entrenamiento |
| Épocas de entrenamiento | `PENDIENTE` | — |
| Clase con más errores | `PENDIENTE` | Matriz de confusión |

Para obtener los valores:

```python
import tensorflow as tf
from tensorflow.keras.datasets import mnist

(_, _), (x_test, y_test) = mnist.load_data()
x_test = x_test.reshape(-1, 28, 28, 1) / 255.0

modelo = tf.keras.models.load_model("models/saved_models/modelo_mnist_cnn_produccion.h5")
loss, acc = modelo.evaluate(x_test, y_test, verbose=0)
print(f"Accuracy en test: {acc:.4f}")
```

Y para la matriz de confusión:

```python
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report

y_pred = np.argmax(modelo.predict(x_test, verbose=0), axis=1)
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred, digits=4))
```

---

## Arquitectura

Un contenedor con la aplicación Django, que carga el artefacto del modelo una
sola vez al arranque y lo mantiene en memoria. El artefacto se monta por volumen,
de modo que reemplazarlo no obliga a reconstruir la imagen.

Flujo de una predicción:

1. **Frontend.** El usuario dibuja en un `<canvas>`; el trazo se serializa como
   dataURL Base64.
2. **API.** `POST /api/v1/predict/` recibe el JSON.
3. **Preprocesamiento.**
   - Decodificación de la imagen.
   - Conversión a escala de grises (`'L'`).
   - Redimensionamiento a `28x28`.
   - Inversión de color (fondo blanco → fondo negro), para igualar la
     convención de MNIST.
   - Normalización `/255.0` y expansión a `(1, 28, 28, 1)`.
4. **Inferencia.** El tensor pasa por el modelo ya cargado en RAM (`apps.py`).
5. **Respuesta.** Clase ganadora (`argmax`) y vector de probabilidades.

---

## Modelo

Red convolucional estándar para clasificación de imágenes en escala de grises:

- Capas `Conv2D` con activación `ReLU`, seguidas de `MaxPooling2D`.
- Capa densa de 128 unidades.
- Salida `Softmax` de 10 clases (dígitos 0–9).

**Formato del artefacto:** `.h5` (HDF5). Se optó por HDF5 sobre `.keras` porque
el formato basado en configuración fallaba al deserializarse en el contenedor
por desajuste de versiones de Keras entre entrenamiento e inferencia — ver
[Incidente A](#incidente-a--error-de-deserialización-quantization_config).

---

## Estructura del proyecto

```
smartdigit/
├── deploy/
│   └── docker/
│       └── Dockerfile.api      # Imagen del backend + dependencias de ML
├── docker-compose.yml
├── requirements.txt            # Versiones fijadas (paridad de entorno)
├── api/
│   ├── config/                 # Configuración de Django
│   ├── apps/
│   │   └── inference/
│   │       ├── apps.py         # Carga del modelo al arranque
│   │       └── views.py        # Preprocesamiento e inferencia
│   └── manage.py
├── frontend/
│   └── static/
│       ├── css/style.css
│       └── js/app.js
├── notebooks/                  # Entrenamiento y evaluación
├── tests/
└── models/
    └── saved_models/
        └── modelo_mnist_cnn_produccion.h5
```

---

## Puesta en marcha

La máquina anfitriona no necesita TensorFlow ni ninguna dependencia de ML: todo
vive dentro del contenedor.

### 1. Clonar y construir

```bash
git clone https://github.com/canischilensis/smartdigit.git
cd smartdigit

docker compose build --no-cache api
docker compose up -d
```

### 2. Inicializar y levantar

```bash
docker compose exec api python manage.py migrate

# --noreload evita que el autoreloader de Django reinicie el proceso
# e invalide las referencias internas del modelo cargado (ver Incidente B)
docker compose exec api python manage.py runserver 0.0.0.0:8000 --noreload
```

### 3. Uso

Abrir `http://localhost:8000`, dibujar un dígito y ver la predicción.

> En Windows con WSL, usar `http://127.0.0.1:8000` o `http://localhost:8000`.
> `0.0.0.0` es una dirección de *bind*, no una URL navegable.

---

## Contrato de la API

**Petición**

```
POST /api/v1/predict/
Content-Type: application/json
```

```json
{ "image": "<dataURL base64 del canvas>" }
```

**Respuesta**

```json
{ "pred": 3, "probs": [0.01, 0.00, 0.02, 0.94, ...] }
```

`GET /api/v1/predict/` devuelve **405 Method Not Allowed**. Es el comportamiento
esperado: el endpoint solo acepta POST.

**Prueba mínima desde la consola del navegador**

```js
fetch("http://127.0.0.1:8000/api/v1/predict/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ image: document.querySelector("canvas").toDataURL("image/png") })
})
  .then(r => r.json().then(data => ({ ok: r.ok, status: r.status, data })))
  .then(console.log)
  .catch(console.error);
```

---

## Postmortem: notebook → contenedor

Tres fallos reales encontrados al pasar de entrenamiento en notebook (Keras 3)
a inferencia en contenedor (`python:3.10-slim` + Django). Se documentan con
síntoma, causa raíz y verificación.

### Incidente A — Error de deserialización `quantization_config`

**Síntoma.** `tf.keras.models.load_model(...)` fallaba dentro del contenedor,
tanto con `.keras` como con `.h5`:

```
Unrecognized keyword arguments passed to Dense: {'quantization_config': None}
```

**Causa raíz.** Desajuste entre la versión de Keras que serializó la topología
—incluyendo el campo `quantization_config`— y la del runtime del contenedor, que
no reconocía ese argumento al reconstruir la capa `Dense`. Es un problema de
paridad de entorno, no del modelo.

**Solución aplicada.** Fijar la versión de las dependencias en
`requirements.txt` y serializar en `.h5`, que guarda pesos y arquitectura sin
depender de la reconstrucción por configuración de Keras 3.

**Alternativa evaluada.** Exportar como TensorFlow SavedModel y cargar con
`tf.saved_model.load()`, evitando por completo la ruta config-based:

```python
import keras
m = keras.models.load_model("modelo_mnist_cnn_produccion.keras", compile=False)
m.export("modelo_mnist_savedmodel", format="tf_saved_model")
```

Verificación dentro del contenedor:

```bash
docker compose exec api python -c "import tensorflow as tf; \
sm = tf.saved_model.load('/models/saved_models/modelo_mnist_savedmodel'); \
print('OK load. has_serve =', hasattr(sm, 'serve'))"
```

Es la opción más robusta para inferencia y queda como mejora pendiente; la
versión actual del servicio usa `.h5`.

### Incidente B — Autoreload de Django y funciones de TensorFlow

**Síntoma.** Respuestas HTTP 500 con el mensaje
*"Called a function referencing variables which have been deleted"*.

**Causa raíz.** El autoreloader de Django reinicia procesos e hilos. Si el
modelo se carga más de una vez, o en el proceso equivocado, las referencias
internas a las variables de TensorFlow quedan inválidas.

**Mitigación.** Levantar con `runserver --noreload` en desarrollo, y cargar el
modelo una sola vez en `apps.py`.

### Incidente C — "Error de conexión" en la UI con la API funcionando

**Síntoma.** La interfaz mostraba error de conexión, pero el endpoint respondía
correctamente al llamarlo con `requests` o `fetch`.

**Causa raíz.** El frontend enviaba un payload con una forma distinta a la
esperada, y capturaba cualquier fallo bajo un mismo mensaje genérico, lo que
ocultaba la causa real. Un 405 en una petición GET de prueba se leía como caída
del servicio.

**Corrección.** Fijar el contrato (`{image}` → `{pred, probs}`), y diferenciar
en el manejo de errores del cliente entre fallo de red, error 4xx y error 5xx.

### Checklist de regresión

- [ ] El artefacto existe en `models/saved_models/` y el volumen está montado.
- [ ] `apps.py` carga el modelo una sola vez, al arranque.
- [ ] En desarrollo, `runserver --noreload`.
- [ ] El frontend envía `{ image: canvas.toDataURL(...) }` y consume `{ pred, probs }`.
- [ ] `POST /api/v1/predict/` responde 200; `GET` responde 405.

---

## Evolución del proyecto

| Versión | Ejecución | Manejo del modelo | Estado |
| --- | --- | --- | --- |
| v1.0 | Notebook en Colab | Archivo local | Descontinuada |
| v2.0 | Django en local | Lectura del archivo en cada petición | Descontinuada |
| v3.0 | API en Docker | `.keras` — fallaba al deserializar | Descontinuada |
| v4.0 | API en Docker | `.h5` cargado una vez en memoria | **Actual** |

---

## Trabajo pendiente

- Completar la tabla de [Resultados](#resultados) con accuracy en test y matriz
  de confusión.
- Migrar el artefacto a TensorFlow SavedModel (ver Incidente A).
- Integrar MLflow para registro de experimentos y versionado del modelo.
- Añadir integración continua que ejecute los tests en cada push.
- Servir con Gunicorn en lugar del servidor de desarrollo de Django.
- Medir latencia de inferencia (p50 y p95) bajo carga.
- Añadir un archivo `LICENSE`.

---

Desarrollado por **Guillermo Vidal** — [@canischilensis](https://github.com/canischilensis)
