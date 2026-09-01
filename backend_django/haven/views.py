"""All SupportSafe API endpoints (mirror of the FastAPI backend's main.py)."""
import json
import os
import tempfile

from bson import ObjectId
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from haven.db import get_database, upload_embeddings_to_mongo
from haven.images import generate_image_urls, upload_image_bytes_to_supabase
from haven.utils.common import (load_image_from_url_or_file,
                                read_files_from_directory,
                                serialize_object_id)
from haven.utils.embedding import find_top_matches, generate_text_embedding
from haven.utils.regex_ptr import extract_info
from haven.utils.steganography import (decode_text_from_image,
                                       encode_text_in_image)
from haven.utils.text_llm import (create_poem, decompose_user_text,
                                  expand_user_text_using_gemma,
                                  expand_user_text_using_gemini)
from haven.utils.twitter import (DEFAULT_HASHTAG, TwitterAPIError,
                                 search_posts_by_hashtag,
                                 send_message_to_twitter)

DOCS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")


def _db():
    db = get_database()
    if db is None:
        raise RuntimeError("Could not connect to the database")
    return db


def _body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


def _error(message, status=500):
    return JsonResponse({"detail": message}, status=status)


@csrf_exempt
@require_POST
def text_generation(request):
    """Expand user input text for help message generation."""
    try:
        data = _body(request)
        concatenated_text = (
            f"Name: {data.get('name')}\n"
            f"Phone: {data.get('phone')}\n"
            f"Location: {data.get('location')}\n"
            f"Duration of Abuse: {data.get('duration_of_abuse')}\n"
            f"Frequency of Incidents: {data.get('frequency_of_incidents')}\n"
            f"Preferred Contact Method: {data.get('preferred_contact_method')}\n"
            f"Current Situation: {data.get('current_situation')}\n"
            f"Culprit Description: {data.get('culprit_description')}\n"
            f"Custom Text: {data.get('custom_text')}\n"
        )
        gemini_response = expand_user_text_using_gemini(concatenated_text)
        gemma_response = expand_user_text_using_gemma(concatenated_text)
        return JsonResponse(
            {"gemini_response": gemini_response, "gemma_response": gemma_response}
        )
    except Exception as e:
        return _error(f"Error expanding text: {e}")


@csrf_exempt
@require_POST
def img_generation(request):
    """Legacy image-from-prompt endpoint (kept for API parity)."""
    try:
        return JsonResponse({"received_text": request.body.decode("utf-8")})
    except Exception as e:
        return _error(f"Error generating image: {e}")


@csrf_exempt
@require_POST
def text_decomposition(request):
    """Decompose and extract information from user text."""
    try:
        text = _body(request).get("text", "")
        decomposed_text = decompose_user_text(text)
        return JsonResponse({"extracted_data": extract_info(decomposed_text)})
    except Exception as e:
        return _error(f"Error decomposing text: {e}")


@csrf_exempt
@require_POST
def save_extracted_data(request):
    """Insert extracted data into the admin collection."""
    try:
        data = _body(request)
        _db()["admin"].insert_one(data)
        return JsonResponse({"status": "Data saved successfully"})
    except Exception as e:
        return _error(f"Error saving data: {e}")


@csrf_exempt
@require_POST
def encode(request):
    """Encode text into an image (query params: text, optional img_url or file)."""
    try:
        text = request.GET.get("text", "")
        img_url = request.GET.get("img_url")
        uploaded = request.FILES.get("file")
        image = load_image_from_url_or_file(img_url, uploaded)
        encoded_image = encode_text_in_image(image, text)
        buffer = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        buffer_name = buffer.name
        buffer.close()  # close the handle before re-opening (Windows file lock)
        encoded_image.save(buffer_name, format="PNG")
        with open(buffer_name, "rb") as f:
            payload = f.read()
        os.unlink(buffer_name)
        response = HttpResponse(payload, content_type="image/png")
        response["Content-Disposition"] = 'attachment; filename="encoded_image.png"'
        return response
    except Exception as e:
        return _error(f"Error encoding text in image: {e}")


@csrf_exempt
@require_POST
def decode(request):
    """Decode text from an image (query param: img_url or multipart file)."""
    try:
        img_url = request.GET.get("img_url")
        uploaded = request.FILES.get("file")
        image = load_image_from_url_or_file(img_url, uploaded)
        return JsonResponse({"decoded_text": decode_text_from_image(image)})
    except Exception as e:
        return _error(f"Error decoding text from image: {e}")


@require_GET
def poem_generation(request):
    """Generate an inspirational poem based on input text."""
    try:
        text = request.GET.get("text", "")
        return JsonResponse({"poem": create_poem(text)})
    except Exception as e:
        return _error(f"Error generating poem: {e}")


@csrf_exempt
@require_POST
def send_message(request):
    """Send a message (with image) to Twitter."""
    try:
        image_url = request.GET.get("image_url", "")
        caption = request.GET.get("caption", "")
        send_message_to_twitter(image_url, caption)
        return JsonResponse({"status": "Message sent successfully"})
    except TwitterAPIError as e:
        return _error(f"Error sending message to Twitter: {e}")
    except Exception as e:
        return _error(f"Error sending message to Twitter: {e}")


@require_GET
def get_admin_posts(request):
    """Retrieve all posts from the database."""
    try:
        posts = [serialize_object_id(post) for post in _db()["admin"].find()]
        return JsonResponse(posts, safe=False)
    except Exception as e:
        return _error(f"Error retrieving posts: {e}")


@require_GET
def find_match(request):
    """Find top matches based on embedding similarity."""
    try:
        info = request.GET.get("info", "")
        collection = request.GET.get("collection", "complains2")
        description_vector = generate_text_embedding(info)
        top_matches = find_top_matches(_db()[collection], description_vector)
        return JsonResponse([serialize_object_id(m) for m in top_matches], safe=False)
    except Exception as e:
        return _error(f"Error finding matches: {e}")


@require_GET
def get_post(request, post_id):
    """Retrieve a specific post by its ID."""
    try:
        post = _db()["admin"].find_one({"_id": ObjectId(post_id)})
        if not post:
            return _error("Post not found", status=404)
        return JsonResponse(serialize_object_id(post))
    except Exception as e:
        return _error(f"Error retrieving post by ID: {e}")


@csrf_exempt
@require_POST
def close_issue(request, issue_id):
    """Mark an issue as closed by updating its status."""
    try:
        result = _db()["admin"].update_one(
            {"_id": ObjectId(issue_id)}, {"$set": {"status": "closed"}}
        )
        if result.modified_count == 0:
            return _error("Issue not found or already closed", status=404)
        return JsonResponse({"status": "Issue marked as closed"})
    except Exception as e:
        return _error(f"Error closing issue: {e}")


@csrf_exempt
@require_POST
def upload_embeddings(request):
    """Upload document embeddings to MongoDB."""
    try:
        file_contents = read_files_from_directory(DOCS_DIR)
        upload_embeddings_to_mongo(file_contents)
        return JsonResponse({"message": "Embeddings uploaded successfully"})
    except Exception as e:
        return _error(f"Error uploading embeddings: {e}")


@csrf_exempt
@require_POST
def generate_image(request):
    """Generate images from a prompt via Gemini and store them in Supabase Storage."""
    try:
        prompt = _body(request).get("prompt")
        image_urls = generate_image_urls(prompt)
        return JsonResponse({"image_urls": image_urls})
    except Exception as e:
        return _error(f"Error generating image: {e}")


@csrf_exempt
@require_POST
def encode_image(request):
    """Hide a message inside an image and store it in Supabase Storage.

    Accepts JSON {text, img_url}. img_url is optional; when omitted a plain
    placeholder image is used. Returns {"encoded_image_url": ...} so the
    victim can share the stego image to social media.
    """
    try:
        data = _body(request)
        text = data.get("text") or ""
        if not text:
            return _error("A message to hide is required", status=400)
        image = load_image_from_url_or_file(img_url=data.get("img_url"))
        encoded_image = encode_text_in_image(image, text)
        from io import BytesIO

        buffer = BytesIO()
        encoded_image.save(buffer, format="PNG")
        encoded_url = upload_image_bytes_to_supabase(buffer.getvalue())
        return JsonResponse({"encoded_image_url": encoded_url})
    except Exception as e:
        return _error(f"Error encoding text in image: {e}")


@csrf_exempt
@require_POST
def send_to_telegram(request):
    """Post the encoded image + caption to the SupportSafe Telegram channel.

    Uses the TELEGRAM_BOT_TOKEN bot, which must be an Administrator of the
    TELEGRAM_CHANNEL_ID channel with "Post messages" permission. This is how
    victim reports reach a place the monitoring team actually watches.
    """
    import requests as requests_lib

    data = _body(request)
    image_url = data.get("image_url")
    caption = (data.get("caption") or "").strip()
    if not image_url:
        return _error("image_url is required", status=400)

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    channel = os.getenv("TELEGRAM_CHANNEL_ID")
    if not token or not channel:
        return JsonResponse(
            {
                "detail": "Telegram is not configured. Create a bot with @BotFather, add it as an administrator of your channel, then set TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID in the .env file.",
                "configured": False,
            },
            status=503,
        )

    try:
        response = requests_lib.post(
            f"https://api.telegram.org/bot{token}/sendPhoto",
            json={
                "chat_id": channel,
                "photo": image_url,
                "caption": caption[:1024],  # Telegram caption limit
            },
            timeout=60,
        )
        payload = response.json()
        if not payload.get("ok"):
            return _error(
                f"Telegram API error: {payload.get('description', 'unknown error')}",
                status=502,
            )
        result = payload["result"]
        # Index the post we just made so it appears in the channel feed
        # (bots never receive their own messages via getUpdates).
        try:
            _store_channel_post(
                _db()["telegram_reports"], requests_lib, token, result
            )
        except Exception as store_error:
            print(f"Could not index the Telegram channel post: {store_error}")
        return JsonResponse(
            {
                "status": "posted",
                "message_id": result["message_id"],
            }
        )
    except Exception as e:
        return _error(f"Error sending to Telegram: {e}")


# ---------------------------------------------------------------------------
# Telegram channel monitoring
# ---------------------------------------------------------------------------
TELEGRAM_OFFSET = {"value": 0}


def _store_channel_post(collection, requests_lib, token, post):
    """Decode and index one channel post. Safe to call repeatedly (upsert)."""
    import re

    message_id = post["message_id"]
    chat = post.get("chat", {})
    if collection.find_one({"chat_id": chat.get("id"), "message_id": message_id}):
        return  # already indexed

    text = post.get("text") or post.get("caption") or ""
    author = (
        (post.get("sender_chat") or {}).get("title")
        or chat.get("title")
        or chat.get("username")
        or "unknown"
    )

    # Image attached to the post: photo (compressed) or document (original
    # bytes, which preserves the steganography payload).
    image_file_id = None
    mime_type = None
    if post.get("photo"):
        image_file_id = post["photo"][-1]["file_id"]  # largest size
        mime_type = "image/jpeg"
    document = post.get("document")
    if document and (document.get("mime_type") or "").startswith("image/"):
        image_file_id = document["file_id"]
        mime_type = document.get("mime_type")

    # Candidate URLs to decode: links shared in the text (e.g. the Supabase
    # link of the encoded image) plus the attached image itself.
    candidate_urls = [
        url.rstrip(").,")
        for url in re.findall(r"https?://\S+", text)
    ]

    file_path = None
    if image_file_id:
        file_resp = requests_lib.get(
            f"https://api.telegram.org/bot{token}/getFile",
            params={"file_id": image_file_id},
            timeout=30,
        )
        file_payload = file_resp.json()
        if file_payload.get("ok"):
            file_path = file_payload["result"]["file_path"]
            candidate_urls.append(
                f"https://api.telegram.org/file/bot{token}/{file_path}"
            )

    decoded_from, decoded_text = _decode_image_urls(candidate_urls)
    if decoded_from and "api.telegram.org" in decoded_from:
        decoded_from = "channel image (Telegram)"  # never leak the bot token

    report = {
        "chat_id": chat.get("id"),
        "chat_title": chat.get("title"),
        "chat_username": chat.get("username"),
        "message_id": message_id,
        "author": author,
        "text": text,
        "has_image": bool(image_file_id),
        "file_path": file_path,
        "mime_type": mime_type,
        "decoded_from": decoded_from or None,
        "decoded_text": decoded_text,
        "has_message": bool(decoded_text),
        "telegram_date": post.get("date"),
    }
    collection.update_one(
        {"chat_id": chat.get("id"), "message_id": message_id},
        {"$set": report},
        upsert=True,
    )


def _poll_telegram_channel(requests_lib, token):
    """Pull new channel posts via getUpdates and index them."""
    response = requests_lib.get(
        f"https://api.telegram.org/bot{token}/getUpdates",
        params={
            "offset": TELEGRAM_OFFSET["value"],
            "timeout": 0,
            "limit": 100,
            "allowed_updates": json.dumps(["channel_post"]),
        },
        timeout=30,
    )
    payload = response.json()
    if not payload.get("ok"):
        raise Exception(
            f"Telegram getUpdates failed: {payload.get('description', 'unknown error')}"
        )

    max_update_id = TELEGRAM_OFFSET["value"] - 1
    for update in payload.get("result", []):
        max_update_id = max(max_update_id, update["update_id"])
        post = update.get("channel_post")
        if post:
            _store_channel_post(
                _db()["telegram_reports"], requests_lib, token, post
            )
    TELEGRAM_OFFSET["value"] = max_update_id + 1


def _serialize_telegram_report(report):
    return {
        "message_id": report.get("message_id"),
        "chat_title": report.get("chat_title"),
        "chat_username": report.get("chat_username"),
        "author": report.get("author"),
        "text": report.get("text", ""),
        "has_image": report.get("has_image", False),
        "decoded_from": report.get("decoded_from"),
        "decoded_text": report.get("decoded_text", ""),
        "has_message": report.get("has_message", False),
        "telegram_date": report.get("telegram_date"),
    }


@require_GET
def telegram_reports(request):
    """Feed of every post in the SupportSafe Telegram channel (dashboard).

    Polls the bot for new channel posts, decodes any steganography payloads,
    stores them in MongoDB, and returns the full stored feed (newest first).
    """
    import requests as requests_lib

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        return JsonResponse(
            {
                "detail": "TELEGRAM_BOT_TOKEN is not configured. Create a bot with @BotFather and add it as an administrator of your channel.",
                "configured": False,
            },
            status=503,
        )

    try:
        _poll_telegram_channel(requests_lib, token)
        stored = [
            _serialize_telegram_report(doc)
            for doc in _db()["telegram_reports"]
            .find()
            .sort("telegram_date", -1)
            .limit(100)
        ]
        return JsonResponse({"count": len(stored), "reports": stored})
    except Exception as e:
        return JsonResponse(
            {"detail": f"Telegram channel error: {e}", "configured": True},
            status=502,
        )


@require_GET
def telegram_image(request):
    """Proxy a channel-post image so the bot token is never exposed."""
    import requests as requests_lib

    message_id = request.GET.get("message_id")
    if not message_id:
        return _error("message_id is required", status=400)
    try:
        message_id = int(message_id)
    except ValueError:
        return _error("message_id must be an integer", status=400)

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        return _error("Telegram is not configured", status=503)

    doc = _db()["telegram_reports"].find_one({"message_id": message_id})
    if not doc or not doc.get("file_path"):
        return _error("Image not found", status=404)

    try:
        response = requests_lib.get(
            f"https://api.telegram.org/file/bot{token}/{doc['file_path']}",
            timeout=60,
        )
    except Exception as e:
        return _error(f"Could not fetch image from Telegram: {e}", status=502)
    if response.status_code != 200:
        return _error("Could not fetch image from Telegram", status=502)
    return HttpResponse(
        response.content,
        content_type=doc.get("mime_type") or "image/jpeg",
    )


def _decode_image_urls(urls):
    """Try to decode a hidden message from each URL; return the first hit."""
    from io import BytesIO

    import requests as requests_lib
    from PIL import Image

    for url in urls:
        try:
            resp = requests_lib.get(url, timeout=60)
            if resp.status_code != 200:
                continue
            image = Image.open(BytesIO(resp.content))
            decoded = decode_text_from_image(image)
            if decoded:
                return url, decoded
        except Exception as e:
            print(f"Could not decode image at {url}: {e}")
    return None, ""


@require_GET
def hashtag_reports(request):
    """Monitor social media for #IloveSupportSafe posts and decode them.

    Searches recent tweets containing the hashtag, then decodes the hidden
    message inside every shared image using LSB steganography.
    """
    try:
        hashtag = request.GET.get("hashtag", DEFAULT_HASHTAG)
        max_results = int(request.GET.get("max_results", 25))
        if not os.getenv("TWITTER_BEARER_TOKEN"):
            return JsonResponse(
                {
                    "detail": "TWITTER_BEARER_TOKEN is not configured. Add it to your .env file to enable hashtag monitoring.",
                    "configured": False,
                },
                status=503,
            )
        posts = search_posts_by_hashtag(hashtag, max_results)

        reports = []
        for post in posts:
            candidate_urls = []
            if post.get("image_url"):
                candidate_urls.append(post["image_url"])
            # Original image links shared in the tweet text (e.g. Supabase
            # storage links) are more likely to still carry the LSB payload
            # because social platforms re-encode uploaded media.
            for url in post.get("extra_urls", []):
                if "supabase" in url or url.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                    candidate_urls.append(url)

            decoded_from, decoded_text = _decode_image_urls(candidate_urls)
            reports.append(
                {
                    "tweet_id": post["tweet_id"],
                    "author": post["author"],
                    "text": post["text"],
                    "image_url": post.get("image_url"),
                    "decoded_from": decoded_from or None,
                    "decoded_text": decoded_text,
                    "has_message": bool(decoded_text),
                    "created_at": post.get("created_at"),
                }
            )
        return JsonResponse(
            {"hashtag": hashtag, "count": len(reports), "reports": reports}
        )
    except TwitterAPIError as e:
        # Credentials are present but the Twitter/X API rejected the request
        # (e.g. 402 credits depleted, 401 invalid token, 429 rate limit).
        # Report it as a real API error instead of "not configured".
        return JsonResponse(
            {"detail": f"Error searching hashtag: {e}", "configured": True},
            status=502,
        )
    except Exception as e:
        return _error(f"Error retrieving hashtag reports: {e}")
