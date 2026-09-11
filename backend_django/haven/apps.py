# Import Django's app-configuration base class
from django.apps import AppConfig


class HavenConfig(AppConfig):
    # Declare the default auto primary-key type for any models defined in this app
    default_auto_field = "django.db.models.BigAutoField"
    # The Python package path Django should import for this app ("haven")
    name = "haven"

