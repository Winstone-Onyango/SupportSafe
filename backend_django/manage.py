#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
# Import the os module to read/write environment variables
import os
# Import the sys module so the script can pass command-line arguments to Django
import sys


def main():
    """Run administrative tasks."""
    # Set the DJANGO_SETTINGS_MODULE env var (unless already set) to point Django at our settings file
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    # Try to import Django's command executor inside try/except to give a friendly error if Django is missing
    try:
        # Import the helper that dispatches management commands (runserver, migrate, check, ...)
        from django.core.management import execute_from_command_line
    # Catch the specific error raised when Django is not installed/importable
    except ImportError as exc:
        # Re-raise as an ImportError with a helpful message pointing to the venv/PYTHONPATH
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    # Hand control to Django, passing along all command-line arguments (e.g. "runserver 127.0.0.1:8000")
    execute_from_command_line(sys.argv)


# Only run main() when this file is executed directly (python manage.py ...), not when imported
if __name__ == "__main__":
    # Kick off Django's command-line handling
    main()
