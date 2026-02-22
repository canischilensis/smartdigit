import os
from django.core.asgi import get_asgi_application

# Apunta al archivo principal de configuración de tu API
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_asgi_application()