# ✍️ SmartDigit: End-to-End MLOps Computer Vision Platform

> **Plataforma MLOps "Production Ready" para Visión Computacional**. Sistema basado en microservicios contenerizados que implementa inferencia en tiempo real de una CNN (Red Neuronal Convolucional) para el reconocimiento de dígitos manuscritos, resolviendo desafíos de paridad de entornos e integrando una API REST robusta.

---

## 📋 Table of Contents

1. [About the Project](https://www.google.com/search?q=%23-about-the-project)
2. [Tech Stack](https://www.google.com/search?q=%23-tech-stack)
3. [Features & Architecture](https://www.google.com/search?q=%23-features--architecture)
4. [Project Structure](https://www.google.com/search?q=%23-project-structure)
5. [Getting Started (Docker)](https://www.google.com/search?q=%23-getting-started-docker)
6. [ML Methodology](https://www.google.com/search?q=%23-ml-methodology)
7. [Evolution & MLOps](https://www.google.com/search?q=%23-evolution--mlops)

---

## 🚀 About The Project

**SmartDigit** representa un ciclo de vida completo de Machine Learning (MLOps). Más allá de entrenar un modelo en un Jupyter Notebook, este proyecto se enfoca en la **Ingeniería de Software para IA**. Resuelve problemas reales de la industria como el "Dependency Hell" entre versiones de Keras/TensorFlow, empaquetado de artefactos y despliegue agnóstico mediante microservicios.

### Key Features

* 🐳 **Portable Deployment:** Empaquetado completo en **Docker** (Python 3.10 Slim). Garantiza la reproducibilidad exacta del entorno de inferencia en cualquier infraestructura, aislando las dependencias matemáticas pesadas.
* 🧩 **Microservices Architecture:** Desacoplamiento total. El modelo de Machine Learning es consumido a través de una API RESTful en Django, separando la capa de aplicación de la capa de inteligencia artificial (preparado para integrarse con MLflow).
* ⚡ **Real-Time Inference Engine:** Interfaz de usuario interactiva (Canvas HTML5) que captura dibujos a mano alzada, los codifica en Base64, y los procesa en milisegundos contra el modelo cargado permanentemente en la memoria RAM del servidor.
* 🛡️ **Robust Artifact Management:** Manejo avanzado de serialización de modelos. Implementa un *fallback* a formato legacy (`.h5` / HDF5) para garantizar la compatibilidad estricta entre el entorno de entrenamiento (TensorFlow 2.17+) y el entorno de producción.

---

## 🛠 Tech Stack

### Infrastructure & MLOps

* **Docker & Docker Compose:** Orquestación de contenedores y mapeo de volúmenes en tiempo real.
* **MLflow:** (Integrable) Trackeo de experimentos y registro de artefactos.
* **Gunicorn:** Servidor WSGI para producción.

### Backend & API

* **Python 3.10+:** Lenguaje base (Slim footprint).
* **Django 4.2+:** Framework core del backend web.
* **Django REST Framework (DRF):** Construcción de endpoints para inferencia.

### Core Machine Learning & Computer Vision

* **TensorFlow / Keras 3:** Framework de Deep Learning.
* **NumPy:** Manipulación de tensores y arrays.
* **Pillow (PIL):** Procesamiento de imágenes (Inversión, Grayscale, Resizing).

### Frontend

* **HTML5 Canvas & Vanilla JS:** UI interactiva sin dependencias pesadas.
* **CSS3:** Diseño responsivo y moderno.

---

## 🏗 Features & Architecture

El sistema implementa una arquitectura orientada a servicios con un flujo de datos bidireccional optimizado:

1. **Interacción (Frontend):** El usuario dibuja en el Canvas web. El trazo se convierte en una cadena Base64.
2. **Recepción (Django API):** El endpoint `/api/v1/predict/` recibe el payload JSON.
3. **Preprocesamiento (Pipeline):** * Decodificación de la imagen.
* Conversión a escala de grises (`'L'`).
* Redimensionamiento estricto a tensores de `28x28`.
* **Inversión de color:** (Blanco a Negro) para emparejar la distribución de los datos originales del dataset MNIST.
* Normalización `/ 255.0` y expansión de dimensiones `(1, 28, 28, 1)`.


4. **Inferencia en Memoria:** El tensor pasa por el artefacto `.h5` previamente cargado en la RAM durante el inicio de la app (`apps.py`).
5. **Respuesta:** La API devuelve la clase ganadora (`np.argmax`) al frontend.

---

## 📂 Project Structure

Estructura final aprobada para producción MLOps:

```bash
smartdigit/
├── deploy/
│   └── docker/
│       └── Dockerfile.api      # 🐳 Receta de la Imagen del Backend/ML
├── docker-compose.yml          # 🐙 Orquestador de Microservicios
├── requirements.txt            # Dependencias estrictas (Environment Parity)
├── api/                        # ⚙️ Backend REST Framework
│   ├── config/                 # Configuraciones de Django
│   ├── apps/
│   │   └── inference/          # Lógica de ML y Endpoint de predicción
│   │       ├── apps.py         # Carga del modelo en memoria RAM
│   │       └── views.py        # Pipeline de preprocesamiento CV
│   └── manage.py
├── frontend/                   # 🎨 Interfaz de Usuario
│   └── static/
│       ├── css/style.css
│       └── js/app.js
└── models/
    └── saved_models/           # 💾 Model Registry (Montado en Volumen)
        └── modelo_mnist_cnn_produccion.h5 # Artefacto Legacy Estable

```

---

## 🏁 Getting Started (Docker)

La forma recomendada de ejecutar **SmartDigit** es mediante Docker Compose. Su máquina host no necesita tener instalado TensorFlow ni dependencias matemáticas complejas.

Aquí tienes **una sección lista para pegar en tu README** (texto plano estilo Markdown). La redacté para que encaje con el enfoque “Production Ready / MLOps” que ya presentas en tu documento actual. 

---

## 🧯 Postmortem & Troubleshooting (Keras/TensorFlow → Docker/WSL)

### Contexto

Durante el paso de **entrenamiento en notebook (Keras 3 / TF reciente)** a **inferencia en contenedor** (`python:3.10-slim` + Django), aparecieron errores típicos de *environment parity* y de contrato Frontend↔API.

---

### Incidente A — Error de deserialización `quantization_config` (Keras `.keras` / `.h5`)

**Síntoma**

* Al cargar el modelo en el contenedor con `tf.keras.models.load_model(...)` (tanto `.keras` como `.h5`) fallaba con:

  * `Unrecognized keyword arguments passed to Dense: {'quantization_config': None}`

**Causa raíz**

* **Desajuste de compatibilidad** entre cómo Keras serializó la topología (incluyendo `quantization_config`) y cómo el runtime del contenedor intentaba deserializar capas como `Dense`.

**Solución definitiva**

* Evitar `load_model()` (config-based) y **exportar el artefacto como TensorFlow SavedModel**, más estable para inferencia en producción.
* Exportación desde notebook:

```python
import keras

m = keras.models.load_model("modelo_mnist_cnn_produccion.keras", compile=False)
m.export("modelo_mnist_savedmodel", format="tf_saved_model")
```

* Ubicación recomendada del artefacto (montado por volumen):

  * `models/saved_models/modelo_mnist_savedmodel/`
  * Debe contener `saved_model.pb` + `variables/`

**Verificación rápida (dentro del contenedor)**

```bash
docker compose exec api python -c "import tensorflow as tf; sm=tf.saved_model.load('/models/saved_models/modelo_mnist_savedmodel'); print('OK load. has_serve=', hasattr(sm,'serve'))"
```

---

### Incidente B — Django autoreload y funciones TF (“variables deleted”)

**Síntoma**

* Respuestas 500 con mensaje tipo:

  * “Called a function referencing variables which have been deleted…”

**Causa raíz**

* El **autoreloader** de Django reinicia procesos/hilos; en modelos TF cargados como `SavedModel`, esto puede invalidar referencias internas si se carga más de una vez o en el proceso equivocado.

**Mitigación recomendada en desarrollo**

* Levantar Django sin autoreload:

```bash
docker compose exec api python manage.py runserver 0.0.0.0:8000 --noreload
```

**Recomendación adicional (buena práctica)**

* En `apps.py`, cargar el modelo una sola vez (evitar doble carga en entornos con reload).

---

### Incidente C — “Error de conexión” en la UI, pero la API funcionaba

**Síntoma**

* La web mostraba “Error de conexión”, pero el endpoint respondía bien al probar con `requests` o `fetch`.

**Causa raíz**

* El frontend enviaba un **payload distinto al esperado** o manejaba errores de forma genérica (y en algunos cambios hubo variables/flujo async incorrectos).
* Importante: `GET /api/v1/predict/` puede devolver **405 Method Not Allowed** (normal), porque el endpoint es **POST**.

**Contrato correcto**

* **Request**: `POST /api/v1/predict/` con JSON:

```json
{ "image": "<dataURL base64 de canvas>" }
```

* **Response**:

```json
{ "pred": 3, "probs": [ ...10 floats... ] }
```

**Prueba mínima desde el navegador (DevTools)**

```js
fetch("http://127.0.0.1:8000/api/v1/predict/", {
  method: "POST",
  headers: {"Content-Type":"application/json"},
  body: JSON.stringify({ image: document.querySelector("canvas").toDataURL("image/png") })
})
.then(r => r.json().then(data => ({ok:r.ok, status:r.status, data})))
.then(({ok, status, data}) => console.log("ok:", ok, "status:", status, "data:", data))
.catch(console.error);
```

---

### Nota WSL/Windows (importante)

* `0.0.0.0` **no es una URL para navegar**; es una dirección de *bind*.
* Desde el navegador en Windows, usa:

  * `http://127.0.0.1:8000/` o `http://localhost:8000/`
* **No es necesario mover el proyecto a Windows** para que “se conecte”: el port mapping de Docker/WSL lo resuelve si los contenedores están bien expuestos (`ports: - "8000:8000"`).

---

### Checklist final (para evitar recaídas)

* [ ] El artefacto en `models/saved_models/modelo_mnist_savedmodel/` contiene `saved_model.pb` y `variables/`.
* [ ] `apps.py` carga vía `tf.saved_model.load()` (no `load_model()`).
* [ ] En desarrollo, correr `runserver --noreload` para evitar reinicios que rompan TF.
* [ ] Frontend envía `{image: canvas.toDataURL(...)}` y consume `{pred, probs}`.
* [ ] El endpoint es `POST /api/v1/predict/` (GET puede devolver 405 y es normal).

---

Si quieres, te lo dejo también como una sección **“Runbook”** (pasos exactos para reproducir + comandos de verificación), o lo ajusto a formato **Postmortem SRE** (Impacto / Detección / Timeline / Acciones Preventivas).


### 1. Clonar y Construir

```bash
git clone https://github.com/tu-usuario/smartdigit.git
cd smartdigit

# Limpiar caché y construir la infraestructura MLOps
docker compose build --no-cache api
docker compose up -d

```

### 2. Inicializar y Levantar el Motor

```bash
# Migrar la base de datos interna de Django
docker compose exec api python manage.py migrate

# Iniciar el servidor (carga el modelo en memoria)
docker compose exec api python manage.py runserver 0.0.0.0:8000

```

### 3. Uso

Abra su navegador web y diríjase a: `http://localhost:8000`.
Dibuje un número en el recuadro y observe la predicción en tiempo real.

---

## 🧮 ML Methodology

El motor de inteligencia artificial está basado en arquitecturas estándar de visión computacional:

* **Arquitectura del Modelo:** Convolutional Neural Network (CNN).
* **Capas Extractoras:** Múltiples capas `Conv2D` con activación `ReLU`, seguidas de `MaxPooling2D` para reducción de dimensionalidad espacial.
* **Capas Clasificadoras:** Red densamente conectada (`Dense` 128 unidades) que culmina en una capa `Softmax` de 10 unidades (dígitos del 0 al 9).
* **Formato de Artefacto:** `.h5` (HDF5) seleccionado estratégicamente sobre `.keras` para garantizar la serialización segura de los pesos y la arquitectura en un entorno contenerizado con restricciones POSIX.

---

## 📊 Evolution & MLOps

Evolución del madurez del proyecto:

| Versión | Arquitectura | Manejo del Modelo | Características Clave | Status |
| --- | --- | --- | --- | --- |
| v1.0 | Colab Notebook | Archivo Local | Entrenamiento exploratorio y EDA | ❌ Deprecated |
| v2.0 | Django Monolith | Lectura por cada Request | UI Básica | ⚠️ Legacy |
| v3.0 | Docker API | Archivo `.keras` (Inestable) | Dockerización de la API | ⚠️ Legacy |
| **v4.0** | **MLOps Microservices** | **Carga única en RAM (`.h5`)** | **Environment Parity + Fallback seguro** | 🚀 **Production** |

---

## ⚠️ Disclaimer

Este software es una demostración de arquitectura de datos e ingeniería MLOps. Los modelos de clasificación de imágenes pueden estar sujetos a sesgos o errores según el trazo del usuario.

---

<div align="center">
<p>Developed with 💻 & ☕ by <strong>Guillermo Vidal / Canis chilensis</strong></p>
<p>
<a href="#">
<img src="[https://img.shields.io/badge/LinkedIn-blue?style=flat&logo=linkedin&logoColor=white](https://img.shields.io/badge/LinkedIn-blue?style=flat&logo=linkedin&logoColor=white)" alt="LinkedIn" />
</a>
<a href="#">
<img src="[https://img.shields.io/badge/GitHub-black?style=flat&logo=github&logoColor=white](https://img.shields.io/badge/GitHub-black?style=flat&logo=github&logoColor=white)" alt="GitHub" />
</a>
</p>
</div>