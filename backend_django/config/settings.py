"""
Django settings for the SupportSafe Django backend (config project).

This backend mirrors the FastAPI backend in `backend/` and exposes the same
HTTP API on port 8000. MongoDB is accessed directly via pymongo (see
`haven/db.py`); Django's ORM is not used for business data.
"""
from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")  # optional local env for the Django backend
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")  # root .env

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-supportsafe-dev-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "haven",
]

MIDDLEWARE = [
    "config.cors.CorsMiddleware",  # CORS first so every response gets headers
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Django's own DB (only used for framework internals; business data lives in MongoDB)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Frontend origin allowed to call this API
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
