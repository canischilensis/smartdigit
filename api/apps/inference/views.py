import base64
import io
import numpy as np
import tensorflow as tf
from PIL import Image
from django.apps import apps as django_apps
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


def _x_from_list(payload):
    """Acepta (28,28), (28,28,1), (1,28,28), (1,28,28,1) o plano (784,)"""
    x = np.array(payload, dtype=np.float32)

    if x.shape == (784,):
        x = x.reshape(28, 28)

    if x.shape == (28, 28):
        x = x.reshape(1, 28, 28, 1)
    elif x.shape == (28, 28, 1):
        x = x.reshape(1, 28, 28, 1)
    elif x.shape == (1, 28, 28):
        x = x.reshape(1, 28, 28, 1)
    elif x.shape == (1, 28, 28, 1):
        pass
    else:
        raise ValueError(f"Shape inválido: {x.shape}. Esperado 28x28 o 1x28x28x1 (o 784).")

    # normalización típica
    if np.max(x) > 1.5:
        x = x / 255.0

    return x


def _x_from_dataurl(dataurl: str):
    """
    Acepta 'data:image/png;base64,...' o solo base64.
    Convierte a 28x28 escala de grises y normaliza [0,1].
    Si la imagen viene con fondo blanco y trazo negro, invierte automáticamente.
    """
    if "," in dataurl and dataurl.strip().startswith("data:image"):
        _, b64 = dataurl.split(",", 1)
    else:
        b64 = dataurl

    raw = base64.b64decode(b64)
    img = Image.open(io.BytesIO(raw)).convert("L")      # grayscale
    img = img.resize((28, 28), Image.BILINEAR)

    arr = np.array(img, dtype=np.float32) / 255.0       # (28,28) en [0,1]

    # Heurística: si el fondo es mayormente blanco, invertimos
    # (tu canvas normalmente es blanco con trazo negro)
    if arr.mean() > 0.5:
        arr = 1.0 - arr

    x = arr.reshape(1, 28, 28, 1).astype(np.float32)
    return x


@api_view(["POST"])
def predict(request):
    cfg = django_apps.get_app_config("inference")

    if cfg.model_fn is None:
        return Response({"error": "Modelo no cargado"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        payload = request.data

        # Caso 1: si te mandan un JSON tipo lista (ej: [[...],[...]])
        if isinstance(payload, list):
            x = _x_from_list(payload)

        # Caso 2: JSON tipo dict
        else:
            if "x" in payload:
                x = _x_from_list(payload["x"])
            elif "image" in payload:
                x = _x_from_dataurl(payload["image"])
            elif "data_url" in payload:
                x = _x_from_dataurl(payload["data_url"])
            elif "pixels" in payload:
                x = _x_from_list(payload["pixels"])
            else:
                return Response(
                    {"error": "Payload inválido. Envíe 'x' (matriz/784) o 'image' (dataURL base64)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        out = cfg.model_fn(tf.constant(x))

        # SavedModel puede devolver dict (signature) o Tensor (serve)
        if isinstance(out, dict):
            out = next(iter(out.values()))

        probs = tf.nn.softmax(out, axis=-1).numpy()[0].tolist()
        pred = int(np.argmax(probs))

        return Response({"pred": pred, "probs": probs})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)