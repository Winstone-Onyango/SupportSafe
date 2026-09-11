"""Create the default admin user: username=winstone, password=Winstone-76"""
# Import os to configure environment variables before Django boots
import os
# Import sys to adjust the module search path and exit on failure
import sys

# Import the Django package so we can call django.setup()
import django
# Import Django's password hasher to store the admin password securely (never plain text)
from django.contrib.auth.hashers import make_password

# Point Django at our settings module before any Django code runs
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
# Add this script's folder (backend_django/) to the path so "config" and "haven" are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# Initialize Django (loads settings, registers apps) so models/DB code works outside runserver
django.setup()

# Import the MongoDB connection helper from the haven app
from haven.db import get_database

# Open (or reuse) the MongoDB database connection
db = get_database()
# If the connection failed, report the error and stop with a non-zero exit code
if db is None:
    # Print an error visible in the terminal
    print("ERROR: Could not connect to database")
    # Exit with status 1 to signal failure to the shell/CI
    sys.exit(1)

# Hard-coded credentials for the bootstrap admin account
username = "Winstone"
# Matching password for the bootstrap admin account
password = "Winstone-76"

# Check whether an admin user with this username already exists in the "users" collection
existing = db["users"].find_one({"username": username})
# If a document came back, the admin is already seeded
if existing:
    # Inform the operator and show the existing document's MongoDB id
    print(f"Admin user '{username}' already exists (id={existing['_id']})")
# Otherwise we need to insert a fresh admin document
else:
    # Insert a new user document with hashed password and the "admin" role
    result = db["users"].insert_one({
        # Display name shown in the admin UI
        "name": "Winstone",
        # Login username
        "username": username,
        # Contact email for the admin account
        "email": "admin@supportsafe.local",
        # Password stored as a Django-hashed string (e.g. pbkdf2_sha256$...)
        "password": make_password(password),
        # Role flag that unlocks admin-only endpoints in the API
        "role": "admin",
    })
    # Confirm creation and echo the new document's id
    print(f"Created admin user '{username}' (id={result.inserted_id})")
    # Print the username so the operator can log in immediately
    print(f"  username: {username}")
    # Print the password (dev-only convenience; change for production)
    print(f"  password: {password}")
# Final confirmation line for the seeding script
print("Done.")

