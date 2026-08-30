"""Simple token-based auth against the MongoDB `users` collection."""
import json

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from haven.db import get_database

TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7  # 7 days


def _public_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "username": user.get("username", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "user"),
    }


def _issue_token(user_id):
    return TimestampSigner().sign(str(user_id))


def _user_from_token(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    token = header.removeprefix("Bearer ").strip()
    try:
        user_id = TimestampSigner().unsign(token, max_age=TOKEN_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return None
    from bson import ObjectId

    return get_database()["users"].find_one({"_id": ObjectId(user_id)})


@csrf_exempt
@require_POST
def register(request):
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
        name = (data.get("name") or "").strip()
        username = (data.get("username") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        role = data.get("role") or "user"
        if role not in ("user", "admin"):
            role = "user"
        if not name or not password:
            return JsonResponse({"detail": "name and password are required"}, status=400)
        if not username and not email:
            return JsonResponse({"detail": "username or email is required"}, status=400)

        db = get_database()
        # Check uniqueness across username and email
        query = {}
        if username:
            query["username"] = username
        if email:
            query = {"$or": [{"username": username}, {"email": email}]} if username and email else ({"email": email} if email else {"username": username})
        if db["users"].find_one(query):
            return JsonResponse({"detail": "A user with this username or email already exists"}, status=409)

        user_doc = {
            "name": name,
            "username": username,
            "email": email,
            "password": make_password(password),
            "role": role,
        }
        user_doc = {k: v for k, v in user_doc.items() if v}  # remove empty fields
        result = db["users"].insert_one(user_doc)
        user = db["users"].find_one({"_id": result.inserted_id})
        return JsonResponse(
            {"token": _issue_token(user["_id"]), "user": _public_user(user)},
            status=201,
        )
    except Exception as e:
        return JsonResponse({"detail": f"Error registering user: {e}"}, status=500)


@csrf_exempt
@require_POST
def login(request):
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
        username = (data.get("username") or "").strip()
        password = data.get("password") or ""

        db = get_database()
        # Look up by username (primary) or email (fallback)
        user = db["users"].find_one({"$or": [{"username": username}, {"email": username}]})
        if user is None or not check_password(password, user.get("password", "")):
            return JsonResponse({"detail": "Invalid username or password"}, status=401)
        # Only the single pre-configured administrator may sign in.
        if user.get("role") != "admin":
            return JsonResponse(
                {"detail": "Only the administrator can sign in to SupportSafe"},
                status=403,
            )

        return JsonResponse({"token": _issue_token(user["_id"]), "user": _public_user(user)})
    except Exception as e:
        return JsonResponse({"detail": f"Error logging in: {e}"}, status=500)


@require_GET
def me(request):
    try:
        user = _user_from_token(request)
        if user is None:
            return JsonResponse({"detail": "Not authenticated"}, status=401)
        return JsonResponse({"user": _public_user(user)})
    except Exception as e:
        return JsonResponse({"detail": f"Error fetching user: {e}"}, status=500)
