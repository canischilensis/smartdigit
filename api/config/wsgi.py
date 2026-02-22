import os
from django.core.wsgi import get_wsgi_application

# Le indica a WSGI dónde encontrar tu configuración
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Expone la aplicación para que Gunicorn o Docker la sirvan
application = get_wsgi_application()