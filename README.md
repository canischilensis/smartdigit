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