import os
from django.apps import AppConfig


class InferenceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "inference"

    # CRÍTICO: mantener el objeto SavedModel vivo
    saved_model = None
    model_fn = None
    endpoint = None

    def ready(self):
        import tensorflow as tf

        # Evita recargar si Django inicializa más de una vez
        if self.saved_model is not None and self.model_fn is not None:
            return

        model_dir = os.environ.get(
            "MODEL_DIR",
            "/models/saved_models/modelo_mnist_savedmodel",
        )

        if not os.path.isdir(model_dir):
            print(f"⚠️ MLOps: No existe el SavedModel en: {model_dir}")
            self.saved_model = None
            self.model_fn = None
            self.endpoint = None
            return

        try:
            sm = tf.saved_model.load(model_dir)

            # Guardar referencia fuerte al objeto (evita variables “deleted”)
            self.saved_model = sm

            if hasattr(sm, "serve"):
                self.model_fn = sm.serve
                self.endpoint = "serve"
            elif hasattr(sm, "signatures") and "serving_default" in sm.signatures:
                self.model_fn = sm.signatures["serving_default"]
                self.endpoint = "serving_default"
            elif hasattr(sm, "signatures") and len(sm.signatures) > 0:
                k = next(iter(sm.signatures.keys()))
                self.model_fn = sm.signatures[k]
                self.endpoint = k
            else:
                raise RuntimeError("SavedModel cargado pero no tiene endpoints (serve/signatures).")

            print(f"✅ MLOps: SavedModel cargado correctamente (endpoint: {self.endpoint})")

        except Exception as e:
            print(f"❌ MLOps: Error cargando SavedModel: {e}")
            self.saved_model = None
            self.model_fn = None
            self.endpoint = None