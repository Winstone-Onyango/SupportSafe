"""Simple token-based auth against the MongoDB `users` collection."""
# json parses the JSON request bodies of register/login
import json

# settings gives access to Django config (currently informational)
from django.conf import settings
# Django's password helpers: verify and hash passwords securely
from django.contrib.auth.hashers import check_password, make_password
# TimestampSigner creates signed, expiring tokens without extra dependencies
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
# JsonResponse sends JSON-encoded HTTP responses
from django.http import JsonResponse
# Decorators: skip CSRF (we use bearer tokens, not cookies) and restrict HTTP verbs
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

# Shared MongoDB connection helper
from haven.db import get_database

# Signed tokens stop working 7 days after they are issued
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7  # 7 days


def _public_user(user):
    # Build a safe representation of a user (never include the password hash)
    return {
        # MongoDB id converted to a string for JSON
        "id": str(user["_id"]),
        # Display name (empty string if missing)
        "name": user.get("name", ""),
        # Login username
        "username": user.get("username", ""),
        # Email address
        "email": user.get("email", ""),
        # "admin" or "user"
        "role": user.get("role", "user"),
    }


def _issue_token(user_id):
    # Sign the user id with a timestamp so tokens expire (Django SECRET_KEY signs it)
    return TimestampSigner().sign(str(user_id))


def _user_from_token(request):
    # Read the Authorization header (e.g. "Bearer <token>")
    header = request.headers.get("Authorization", "")
    # Reject requests that don't use the Bearer scheme
    if not header.startswith("Bearer "):
        # Signal "no valid identity" to the caller
        return None
    # Strip the "Bearer " prefix and any surrounding whitespace
    token = header.removeprefix("Bearer ").strip()
    # Validate signature + expiry; both failures mean "unauthenticated"
    try:
        # Recover the original user id if the signature and age are valid
        user_id = TimestampSigner().unsign(token, max_age=TOKEN_MAX_AGE_SECONDS)
    # Bad signature (forged) or expired token
    except (BadSignature, SignatureExpired):
        # Treat both as unauthenticated
        return None
    # Imported lazily so bson is only needed when auth actually runs
    from bson import ObjectId

    # Look up and return the user document for this id (None if deleted)
    return get_database()["users"].find_one({"_id": ObjectId(user_id)})


@csrf_exempt
@require_POST
def register(request):
    # Catch any unexpected error and return a clean 500 instead of a crash
    try:
        # Parse the JSON body (empty body treated as an empty object)
        data = json.loads(request.body.decode("utf-8") or "{}")
        # Trim the display name
        name = (data.get("name") or "").strip()
        # Trim the username
        username = (data.get("username") or "").strip()
        # Trim and lowercase the email for consistent uniqueness checks
        email = (data.get("email") or "").strip().lower()
        # Password arrives as plain text over HTTPS and is hashed below
        password = data.get("password") or ""
        # Default new accounts to the "user" role
        role = data.get("role") or "user"
        # Only allow known roles; anything else falls back to "user"
        if role not in ("user", "admin"):
            # Force the safe default
            role = "user"
        # Both name and password are mandatory
        if not name or not password:
            # 400 Bad Request with a human-readable reason
            return JsonResponse({"detail": "name and password are required"}, status=400)
        # At least one of username/email must identify the account
        if not username and not email:
            # 400 Bad Request with a human-readable reason
            return JsonResponse({"detail": "username or email is required"}, status=400)

        # Get the cached MongoDB handle
        db = get_database()
        # Check uniqueness across username and email
        # Build the duplicate-detection query dynamically
        query = {}
        # Username alone is enough to check
        if username:
            # Start with a simple username lookup
            query["username"] = username
        # When both identifiers exist, check either one for duplicates
        if email:
            # Match either the username or the email (or only whichever is present)
            query = {"$or": [{"username": username}, {"email": email}]} if username and email else ({"email": email} if email else {"username": username})
        # If any existing user matches, block the registration
        if db["users"].find_one(query):
            # 409 Conflict tells the frontend the account already exists
            return JsonResponse({"detail": "A user with this username or email already exists"}, status=409)

        # Assemble the new user document
        user_doc = {
            # Display name
            "name": name,
            # Username (may be empty if email-only)
            "username": username,
            # Email (may be empty if username-only)
            "email": email,
            # Hashed password — plain text is never stored
            "password": make_password(password),
            # Role assigned above
            "role": role,
        }
        # Drop any empty fields so the stored document is clean
        user_doc = {k: v for k, v in user_doc.items() if v}  # remove empty fields
        # Insert the user into MongoDB
        result = db["users"].insert_one(user_doc)
        # Re-read the stored document (now containing the _id)
        user = db["users"].find_one({"_id": result.inserted_id})
        # Respond 201 Created with a fresh token + public profile
        return JsonResponse(
            {"token": _issue_token(user["_id"]), "user": _public_user(user)},
            status=201,
        )
    # Any unexpected exception lands here
    except Exception as e:
        # Return a 500 with the error message for debugging
        return JsonResponse({"detail": f"Error registering user: {e}"}, status=500)


@csrf_exempt
@require_POST
def login(request):
    # Catch unexpected errors and return a clean JSON 500
    try:
        # Parse the JSON body
        data = json.loads(request.body.decode("utf-8") or "{}")
        # Accept a username OR an email in the same field
        username = (data.get("username") or "").strip()
        # Plain-text password from the request
        password = data.get("password") or ""

        # Get the cached MongoDB handle
        db = get_database()
        # Look up by username (primary) or email (fallback)
        # One query matches either identifier
        user = db["users"].find_one({"$or": [{"username": username}, {"email": username}]})
        # Unknown user OR wrong password both return the same generic error
        if user is None or not check_password(password, user.get("password", "")):
            # 401 Unauthorized (no hint about which field was wrong)
            return JsonResponse({"detail": "Invalid username or password"}, status=401)
        # Only the single pre-configured administrator may sign in.
        # SupportSafe's dashboard is admin-only: regular accounts cannot use it
        if user.get("role") != "admin":
            # 403 Forbidden with a clear explanation
            return JsonResponse(
                {"detail": "Only the administrator can sign in to SupportSafe"},
                status=403,
            )

        # Success: issue a fresh 7-day token and return the public profile
        return JsonResponse({"token": _issue_token(user["_id"]), "user": _public_user(user)})
    # Any unexpected exception lands here
    except Exception as e:
        # Return a 500 with the error message for debugging
        return JsonResponse({"detail": f"Error logging in: {e}"}, status=500)


@require_GET
def me(request):
    # Catch unexpected errors and return a clean JSON 500
    try:
        # Resolve the bearer token back to a user document
        user = _user_from_token(request)
        # Missing/expired/invalid token means unauthenticated
        if user is None:
            # 401 Unauthorized
            return JsonResponse({"detail": "Not authenticated"}, status=401)
        # Return the caller's own public profile
        return JsonResponse({"user": _public_user(user)})
    # Any unexpected exception lands here
    except Exception as e:
        # Return a 500 with the error message for debugging
        return JsonResponse({"detail": f"Error fetching user: {e}"}, status=500)
