"""Create the default admin user: username=winstone, password=Winstone-76"""
import os
import sys

import django
from django.contrib.auth.hashers import make_password

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from haven.db import get_database

db = get_database()
if db is None:
    print("ERROR: Could not connect to database")
    sys.exit(1)

username = "Winstone"
password = "Winstone-76"

existing = db["users"].find_one({"username": username})
if existing:
    print(f"Admin user '{username}' already exists (id={existing['_id']})")
else:
    result = db["users"].insert_one({
        "name": "Winstone",
        "username": username,
        "email": "admin@supportsafe.local",
        "password": make_password(password),
        "role": "admin",
    })
    print(f"Created admin user '{username}' (id={result.inserted_id})")
    print(f"  username: {username}")
    print(f"  password: {password}")
print("Done.")
