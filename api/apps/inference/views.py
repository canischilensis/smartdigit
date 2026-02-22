import numpy as np
import tensorflow as tf
from django.apps import apps as django_apps
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(["POST"])
def predict(request):
    cfg = django_apps.get_app_config("inference")

    if cfg.model_fn is None:
        return Response({"error": "Modelo no cargado"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    if "x" not in request.data:
        return Response({"error": "Falta campo 'x' en el JSON"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        x = np.array(request.data["x"], dtype=np.float32)

        # Admitimos: (28,28) / (28,28,1) / (1,28,28) / (1,28,28,1)
        if x.shape == (28, 28):
            x = x.reshape(1, 28, 28, 1)
        elif x.shape == (28, 28, 1):
            x = x.reshape(1, 28, 28, 1)
        elif x.shape == (1, 28, 28):
            x = x.reshape(1, 28, 28, 1)
        elif x.shape == (1, 28, 28, 1):
            pass
        else:
            return Response(
                {"error": f"Shape inválido: {x.shape}. Esperado (28,28) o (1,28,28,1)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Normalización típica MNIST
        if np.max(x) > 1.5:
            x = x / 255.0

        # Inferencia
        out = cfg.model_fn(tf.constant(x))

        # SavedModel puede devolver dict (signature) o Tensor (serve)
        if isinstance(out, dict):
            out = next(iter(out.values()))

        # Si son logits, softmax; si ya son probs, no hace daño grave pero mejor:
        probs = tf.nn.softmax(out, axis=-1).numpy()[0].tolist()
        pred = int(np.argmax(probs))

        return Response({"pred": pred, "probs": probs})

    except Exception as e:
        # Para debug: entrega el error (en prod conviene ocultarlo)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)