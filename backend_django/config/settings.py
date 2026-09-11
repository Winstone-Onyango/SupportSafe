"""
Django settings for the SupportSafe Django backend (config project).

This is the sole application backend and exposes the HTTP API on port 8000. MongoDB is accessed directly via pymongo (see
`haven/db.py`); Django's ORM is not used for business data.
"""
# Pathlib lets us build filesystem paths that work on Windows and Linux alike
from pathlib import Path
# os is used to read environment variables
import os
# python-dotenv loads key=value pairs from .env files into the environment
from dotenv import load_dotenv

# BASE_DIR = the backend_django/ folder (two levels up from this file: config/settings.py)
BASE_DIR = Path(__file__).resolve().parent.parent
# Load an optional backend_django/.env first (values here take precedence)
load_dotenv(BASE_DIR / ".env")  # optional local env for the Django backend
# Then load the repository-root .env (shared with the frontend) for API keys etc.
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")  # root .env

# Secret used by Django for signing (tokens, sessions); falls back to an insecure dev key
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-supportsafe-dev-key-change-me")
# Enable verbose error pages in development (reads DJANGO_DEBUG=true/false, default true)
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"
# Accept requests for any Host (fine for a local/dev deployment; restrict in production)
ALLOWED_HOSTS = ["*"]

# Django apps that are actually used; note there is no admin/auth app views dependency
INSTALLED_APPS = [
    # Provides content-type bookkeeping used by contrib.auth
    "django.contrib.contenttypes",
    # Provides the password hashers (make_password/check_password) used for user auth
    "django.contrib.auth",
    # Our single application containing all API views and MongoDB access
    "haven",
]

# Middleware runs top-to-bottom on requests (and bottom-to-top on responses)
MIDDLEWARE = [
    # CORS first so every response gets headers
    "config.cors.CorsMiddleware",  # CORS first so every response gets headers
    # Standard Django security hardening (e.g. XSS protection headers)
    "django.middleware.security.SecurityMiddleware",
    # Handles URL normalization (trailing slashes, APPEND_SLASH redirects)
    "django.middleware.common.CommonMiddleware",
]

# Which URLconf module maps incoming URLs to views
ROOT_URLCONF = "config.urls"

# Template engine config; kept minimal because this API serves JSON, not HTML
TEMPLATES = [
    {
        # Use Django's built-in template backend
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # No extra project-level template directories
        "DIRS": [],
        # Look for templates inside each installed app's templates/ folder
        "APP_DIRS": True,
        # No context processors are needed for this JSON-only API
        "OPTIONS": {"context_processors": []},
    },
]

# Points Django at the WSGI application object created in config/wsgi.py
WSGI_APPLICATION = "config.wsgi.application"

# Django's own DB (only used for framework internals; business data lives in MongoDB)
# SQLite is configured only to satisfy Django's framework internals (e.g. admin/migrations);
DATABASES = {
    "default": {
        # Use the built-in SQLite engine — zero setup
        "ENGINE": "django.db.backends.sqlite3",
        # Store the file at backend_django/db.sqlite3
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Localization settings (English, UTC timestamps)
LANGUAGE_CODE = "en-us"
# All datetimes are stored/processed in UTC
TIME_ZONE = "UTC"
# Enable Django's translation framework
USE_I18N = True
# Make datetime objects timezone-aware
USE_TZ = True

# Default primary key field type for Django models (not really used; no business models)
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Frontend origin allowed to call this API
# The single origin that the CORS middleware will whitelist in every response
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

