# Import os to set the Django settings environment variable
import os

# Import Django's factory that builds a WSGI-compatible application object
from django.core.wsgi import get_wsgi_application

# Tell Django which settings module to use (only if not already configured)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
# Create the WSGI application used by production servers like gunicorn/waitress (and runserver)
application = get_wsgi_application()

