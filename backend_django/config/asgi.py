# Import os to set the Django settings environment variable
import os

# Import Django's factory that builds an ASGI-compatible application object
from django.core.asgi import get_asgi_application

# Tell Django which settings module to use (only if not already configured)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
# Create the ASGI application used by async servers (e.g. uvicorn/daphne) if ever needed
application = get_asgi_application()

