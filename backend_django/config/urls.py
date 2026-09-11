# Import Django's URL routing helpers
from django.urls import include, path

# Root URL table for the whole Django project
urlpatterns = [
    # Delegate every path to the haven app's URL configuration (all API routes live there)
    path("", include("haven.urls")),
]

