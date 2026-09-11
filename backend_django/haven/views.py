"""All SupportSafe API endpoints (the Django application backend)."""
# json parses incoming JSON request bodies
import json
# os reads env vars (Telegram/Twitter tokens) and manipulates paths/files
import os
# tempfile creates the temporary PNG file used by the /encode endpoint
import tempfile

# ObjectId converts string ids from URLs into MongoDB ObjectId objects
from bson import ObjectId
# HttpResponse serves raw bytes (PNG images); JsonResponse serves JSON
from django.http import HttpResponse, JsonResponse
# Skip Django's CSRF checks (this is a token-authenticated JSON API, not a form site)
from django.views.decorators.csrf import csrf_exempt
# Restrict views to the correct HTTP verbs (GET/POST)
from django.views.decorators.http import require_GET, require_POST

# Database access + lawbot knowledge-base uploader
from haven.db import get_database, upload_embeddings_to_mongo
# Image generation (Pollinations) and Supabase Storage upload helpers
from haven.images import generate_image_urls, upload_image_bytes_to_supabase
# General helpers: image loading, document reading, id serialization
from haven.utils.common import (load_image_from_url_or_file,
                                read_files_from_directory,
                                serialize_object_id)
# Vector embedding generation and MongoDB vector search
from haven.utils.embedding import find_top_matches, generate_text_embedding
# Regex parser that turns LLM key/value output into a dict
from haven.utils.regex_ptr import extract_info
# LSB steganography encode/decode helpers
from haven.utils.steganography import (decode_text_from_image,
                                       encode_text_in_image)
# LLM helpers: report expansion, decomposition, poem generation
from haven.utils.text_llm import (create_poem, decompose_user_text,
                                  expand_user_text_using_gemma,
                                  expand_user_text_using_gemini)
# Twitter/X helpers: hashtag search and tweet posting
from haven.utils.twitter import (DEFAULT_HASHTAG, TwitterAPIError,
                                 search_posts_by_hashtag,
                                 send_message_to_twitter)

# Folder holding the lawbot PDFs (relative to this file: haven/docs/)
DOCS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")


def _db():
    # Get the cached database handle
    db = get_database()
    # Views can't do anything without MongoDB — fail fast with a clear error
    if db is None:
        # Raise so the caller's except block turns it into a 500 JSON error
        raise RuntimeError("Could not connect to the database")
    # Return the usable database object
    return db


def _body(request):
    # Parsing can fail on malformed/empty bodies — never crash for that
    try:
        # Decode the raw bytes and parse JSON; empty body behaves like {}
        return json.loads(request.body.decode("utf-8") or "{}")
    # Invalid JSON is treated the same as an empty body
    except json.JSONDecodeError:
        # Return a dict so data.get(...) calls in views keep working
        return {}


def _error(message, status=500):
    # Consistent JSON error shape used by every endpoint in this module
    return JsonResponse({"detail": message}, status=status)


@csrf_exempt
@require_POST
def text_generation(request):
    """Expand user input text for help message generation."""
    # Convert any provider/network failure into a JSON 500
    try:
        # Parse the JSON payload sent by the frontend form
        data = _body(request)
        # Flatten all form fields into one labeled text block for the LLM
        concatenated_text = (
            # Victim's name
            f"Name: {data.get('name')}\n"
            # Phone number for authorities to call back
            f"Phone: {data.get('phone')}\n"
            # Where the victim is (address or lat,lng)
            f"Location: {data.get('location')}\n"
            # How long the abuse has been going on
            f"Duration of Abuse: {data.get('duration_of_abuse')}\n"
            # How often incidents happen
            f"Frequency of Incidents: {data.get('frequency_of_incidents')}\n"
            # Phone/email/text/in-person preference
            f"Preferred Contact Method: {data.get('preferred_contact_method')}\n"
            # Free-text description of what's happening now
            f"Current Situation: {data.get('current_situation')}\n"
            # Description of the perpetrator
            f"Culprit Description: {data.get('culprit_description')}\n"
            # Anything extra the victim typed
            f"Custom Text: {data.get('custom_text')}\n"
        )
        # Primary expansion via Gemini (with Groq fallback inside)
        gemini_response = expand_user_text_using_gemini(concatenated_text)
        # Secondary expansion via Groq for comparison in the UI
        gemma_response = expand_user_text_using_gemma(concatenated_text)
        # Return both narratives so the victim can pick the better one
        return JsonResponse(
            {"gemini_response": gemini_response, "gemma_response": gemma_response}
        )
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error expanding text: {e}")


@csrf_exempt
@require_POST
def img_generation(request):
    """Legacy image-from-prompt endpoint (kept for API parity)."""
    # Convert any failure into a JSON 500
    try:
        # Simply echo the raw body back — this endpoint is retained for compatibility
        return JsonResponse({"received_text": request.body.decode("utf-8")})
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error generating image: {e}")


@csrf_exempt
@require_POST
def text_decomposition(request):
    """Decompose and extract information from user text."""
    # Convert any LLM/parsing failure into a JSON 500
    try:
        # Read the free-text paragraph from the JSON body
        text = _body(request).get("text", "")
        # Ask the LLM to output structured "N. Key: value" lines
        decomposed_text = decompose_user_text(text)
        # Parse those lines into a dict and return it
        return JsonResponse({"extracted_data": extract_info(decomposed_text)})
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error decomposing text: {e}")


@csrf_exempt
@require_POST
def save_extracted_data(request):
    """Insert extracted data into the admin collection."""
    # Convert any DB failure into a JSON 500
    try:
        # Parse the full report payload (already structured by the frontend)
        data = _body(request)
        # Store it verbatim in the "admin" collection (the dashboard's data source)
        _db()["admin"].insert_one(data)
        # Confirm success to the frontend
        return JsonResponse({"status": "Data saved successfully"})
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error saving data: {e}")


@csrf_exempt
@require_POST
def encode(request):
    """Encode text into an image (query params: text, optional img_url or file)."""
    # Convert any image/encoding failure into a JSON 500
    try:
        # Secret message to hide comes from the query string
        text = request.GET.get("text", "")
        # Optional carrier image: either a URL...
        img_url = request.GET.get("img_url")
        # ...or an uploaded multipart file
        uploaded = request.FILES.get("file")
        # Resolve the carrier image (falls back to a blue placeholder if none given)
        image = load_image_from_url_or_file(img_url, uploaded)
        # Hide the message bits inside the image's red-channel LSBs
        encoded_image = encode_text_in_image(image, text)
        # Create a temp file to hold the PNG before streaming it back
        buffer = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        # Remember the temp file's name for the save/delete steps
        buffer_name = buffer.name
        # close the handle before re-opening (Windows file lock)
        buffer.close()  # close the handle before re-opening (Windows file lock)
        # Write the encoded image to disk as a real PNG
        encoded_image.save(buffer_name, format="PNG")
        # Read the PNG bytes back so they can be sent in the response
        with open(buffer_name, "rb") as f:
            # Load the full file content into memory
            payload = f.read()
        # Delete the temp file — its bytes are already in memory
        os.unlink(buffer_name)
        # Build a binary response containing the PNG
        response = HttpResponse(payload, content_type="image/png")
        # Ask the browser to download it as encoded_image.png
        response["Content-Disposition"] = 'attachment; filename="encoded_image.png"'
        # Send the stego image to the caller
        return response
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error encoding text in image: {e}")


@csrf_exempt
@require_POST
def decode(request):
    """Decode text from an image (query param: img_url or multipart file)."""
    # Convert any image/decoding failure into a JSON 500
    try:
        # Source image: either a URL...
        img_url = request.GET.get("img_url")
        # ...or an uploaded multipart file
        uploaded = request.FILES.get("file")
        # Load the image from whichever source was provided
        image = load_image_from_url_or_file(img_url, uploaded)
        # Recover the hidden message (empty string if none) and return it
        return JsonResponse({"decoded_text": decode_text_from_image(image)})
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error decoding text from image: {e}")


@require_GET
def poem_generation(request):
    """Generate an inspirational poem based on input text."""
    # Convert any LLM failure into a JSON 500
    try:
        # Optional seed text that steers the poem's theme
        text = request.GET.get("text", "")
        # Generate via Gemini (Groq fallback) and return the poem
        return JsonResponse({"poem": create_poem(text)})
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error generating poem: {e}")


@csrf_exempt
@require_POST
def send_message(request):
    """Send a message (with image) to Twitter."""
    # Convert any Twitter failure into a JSON 500
    try:
        # Public URL of the image to attach (query param)
        image_url = request.GET.get("image_url", "")
        # Tweet text (query param)
        caption = request.GET.get("caption", "")
        # Delegate the download + upload + tweet creation to the Twitter helper
        send_message_to_twitter(image_url, caption)
        # Confirm success to the frontend
        return JsonResponse({"status": "Message sent successfully"})
    # Twitter API rejections get the same JSON error treatment
    except TwitterAPIError as e:
        # JSON 500 with the API's message
        return _error(f"Error sending message to Twitter: {e}")
    # Any other unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error sending message to Twitter: {e}")


@require_GET
def get_admin_posts(request):
    """Retrieve all posts from the database."""
    # Convert any DB failure into a JSON 500
    try:
        # Fetch every report document, converting ObjectIds to strings for JSON
        posts = [serialize_object_id(post) for post in _db()["admin"].find()]
        # safe=False allows returning a top-level JSON array
        return JsonResponse(posts, safe=False)
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error retrieving posts: {e}")


@require_GET
def find_match(request):
    """Find top matches based on embedding similarity."""
    # Convert any embedding/search failure into a JSON 500
    try:
        # Description to match against (e.g. culprit appearance)
        info = request.GET.get("info", "")
        # Which collection to search — defaults to the reports collection
        collection = request.GET.get("collection", "complains2")
        # Convert the description text into a 768-dim query vector
        description_vector = generate_text_embedding(info)
        # Run the Atlas vector search over the chosen collection
        top_matches = find_top_matches(_db()[collection], description_vector)
        # Serialize ObjectIds and return the ranked matches as a JSON array
        return JsonResponse([serialize_object_id(m) for m in top_matches], safe=False)
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error finding matches: {e}")


@require_GET
def get_post(request, post_id):
    """Retrieve a specific post by its ID."""
    # Convert bad ids/DB failures into a JSON 500 (404 handled below)
    try:
        # Look up the single report whose _id matches the URL parameter
        post = _db()["admin"].find_one({"_id": ObjectId(post_id)})
        # No document means the id doesn't exist
        if not post:
            # 404 Not Found
            return _error("Post not found", status=404)
        # Return the post with ObjectIds converted to strings
        return JsonResponse(serialize_object_id(post))
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error retrieving post by ID: {e}")


@csrf_exempt
@require_POST
def close_issue(request, issue_id):
    """Mark an issue as closed by updating its status."""
    # Convert bad ids/DB failures into a JSON 500 (404 handled below)
    try:
        # Flip the status field to "closed" for the matching document
        result = _db()["admin"].update_one(
            {"_id": ObjectId(issue_id)}, {"$set": {"status": "closed"}}
        )
        # Zero modifications means the id was wrong or already closed
        if result.modified_count == 0:
            # 404 Not Found with an explanatory message
            return _error("Issue not found or already closed", status=404)
        # Confirm the state change to the frontend
        return JsonResponse({"status": "Issue marked as closed"})
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error closing issue: {e}")


@csrf_exempt
@require_POST
def upload_embeddings(request):
    """Upload document embeddings to MongoDB."""
    # Convert any file/embedding failure into a JSON 500
    try:
        # Read every PDF/text file in haven/docs/ (the lawbot knowledge base)
        file_contents = read_files_from_directory(DOCS_DIR)
        # Chunk, embed, and store each chunk in the doc_embedding collection
        upload_embeddings_to_mongo(file_contents)
        # Confirm the knowledge base was refreshed
        return JsonResponse({"message": "Embeddings uploaded successfully"})
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error uploading embeddings: {e}")


@csrf_exempt
@require_POST
def generate_image(request):
    """Generate images from a prompt via Gemini and store them in Supabase Storage."""
    # Convert any provider/storage failure into a JSON 500
    try:
        # Read the image description from the JSON body
        prompt = _body(request).get("prompt")
        # Generate via Pollinations (with retries) and upload to Supabase
        image_urls = generate_image_urls(prompt)
        # Return the public URLs for the frontend to display/share
        return JsonResponse({"image_urls": image_urls})
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error generating image: {e}")


@csrf_exempt
@require_POST
def encode_image(request):
    """Hide a message inside an image and store it in Supabase Storage.

    Accepts JSON {text, img_url}. img_url is optional; when omitted a plain
    placeholder image is used. Returns {"encoded_image_url": ...} so the
    victim can share the stego image to social media.
    """
    # Convert any validation/encoding/storage failure into a JSON 500
    try:
        # Parse the JSON payload
        data = _body(request)
        # The secret message to hide is mandatory
        text = data.get("text") or ""
        # Reject requests with nothing to hide
        if not text:
            # 400 Bad Request with a clear reason
            return _error("A message to hide is required", status=400)
        # Load the carrier image (blue placeholder when img_url is absent)
        image = load_image_from_url_or_file(img_url=data.get("img_url"))
        # Embed the message bits into the image
        encoded_image = encode_text_in_image(image, text)
        # Imported here so PIL/BytesIO are only needed on this code path
        from io import BytesIO

        # In-memory buffer to receive the PNG bytes
        buffer = BytesIO()
        # Save the stego image as a PNG in memory (no temp files needed)
        encoded_image.save(buffer, format="PNG")
        # Upload the PNG bytes to Supabase and get a shareable URL
        encoded_url = upload_image_bytes_to_supabase(buffer.getvalue())
        # Return the URL the victim can post to social media
        return JsonResponse({"encoded_image_url": encoded_url})
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error encoding text in image: {e}")


@csrf_exempt
@require_POST
def send_to_telegram(request):
    """Post the encoded image + caption to the SupportSafe Telegram channel.

    Uses the TELEGRAM_BOT_TOKEN bot, which must be an Administrator of the
    TELEGRAM_CHANNEL_ID channel with "Post messages" permission. This is how
    victim reports reach a place the monitoring team actually watches.
    """
    # requests is imported locally to keep module import time low
    import requests as requests_lib

    # Parse the JSON payload
    data = _body(request)
    # Public URL of the stego image to publish
    image_url = data.get("image_url")
    # Optional caption text, trimmed of stray whitespace
    caption = (data.get("caption") or "").strip()
    # The image is the core of the report — refuse to post without it
    if not image_url:
        # 400 Bad Request with a clear reason
        return _error("image_url is required", status=400)

    # Bot token from @BotFather
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    # Target channel id/username
    channel = os.getenv("TELEGRAM_CHANNEL_ID")
    # Without both credentials the feature is disabled — explain how to set it up
    if not token or not channel:
        # 503 Service Unavailable plus setup instructions
        return JsonResponse(
            {
                "detail": "Telegram is not configured. Create a bot with @BotFather, add it as an administrator of your channel, then set TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID in the .env file.",
                "configured": False,
            },
            status=503,
        )

    # Wrap all network work so failures become clean JSON errors
    try:
        # Download the image here and upload the bytes. Telegram's servers
        # sometimes cannot fetch certain URLs themselves, so this is the
        # reliable path.
        # Fetch the image bytes with a 60s timeout
        image_resp = requests_lib.get(image_url, timeout=60)
        # A non-200 means the source URL is dead or blocked
        if image_resp.status_code != 200:
            # 502 Bad Gateway naming the HTTP status we hit
            return _error(
                f"Could not download the image to post (HTTP {image_resp.status_code}).",
                status=502,
            )
        # Post the photo to the channel via Telegram's sendPhoto API
        response = requests_lib.post(
            # Bot API endpoint with the token embedded in the path
            f"https://api.telegram.org/bot{token}/sendPhoto",
            # Form fields: destination chat and caption text
            data={
                "chat_id": channel,
                "caption": caption[:1024],  # Telegram caption limit
            },
            # Multipart file upload of the downloaded image bytes
            files={"photo": ("report.png", image_resp.content)},
            # Generous timeout for the upload
            timeout=120,
        )
        # Parse Telegram's JSON reply
        payload = response.json()
        # Telegram signals failures with ok=false
        if not payload.get("ok"):
            # Surface Telegram's own error description
            return _error(
                f"Telegram API error: {payload.get('description', 'unknown error')}",
                status=502,
            )
        # Extract the successfully posted message object
        result = payload["result"]
        # Index the post we just made so it appears in the channel feed
        # (bots never receive their own messages via getUpdates).
        # Indexing is best-effort — a failure here shouldn't fail the request
        try:
            # Decode + store this post in the telegram_reports collection
            _store_channel_post(
                # Destination collection
                _db()["telegram_reports"],
                # requests module to reuse
                requests_lib,
                # Bot token for file API calls
                token,
                # The posted message object
                result,
                extra_urls=[image_url],  # original encoded image for decoding
            )
        # Indexing problems are logged but never surfaced to the user
        except Exception as store_error:
            # Log why the indexing step failed
            print(f"Could not index the Telegram channel post: {store_error}")
        # Success response with the Telegram message id for reference
        return JsonResponse(
            {
                # Status flag for the frontend
                "status": "posted",
                # Telegram's message id (useful for linking/debugging)
                "message_id": result["message_id"],
            }
        )
    # Any unexpected exception lands here
    except Exception as e:
        # JSON 500 with the underlying message
        return _error(f"Error sending to Telegram: {e}")


# ---------------------------------------------------------------------------
# Telegram channel monitoring
# ---------------------------------------------------------------------------
# Remembers the last processed update id so polling never re-reads old posts
TELEGRAM_OFFSET = {"value": 0}


def _store_channel_post(collection, requests_lib, token, post, extra_urls=None):
    """Decode and index one channel post. Safe to call repeatedly (upsert)."""
    # re extracts candidate image URLs from the post text
    import re

    # Telegram's unique id for this message within the chat
    message_id = post["message_id"]
    # Chat object describing the channel the post belongs to
    chat = post.get("chat", {})
    # Skip work entirely if this exact post was already indexed (idempotency)
    if collection.find_one({"chat_id": chat.get("id"), "message_id": message_id}):
        # Already indexed
        return  # already indexed

    # Prefer the message text; fall back to the photo caption
    text = post.get("text") or post.get("caption") or ""
    # Resolve a human-readable author: sender channel title, chat title, or handle
    author = (
        (post.get("sender_chat") or {}).get("title")
        or chat.get("title")
        or chat.get("username")
        or "unknown"
    )

    # Image attached to the post: photo (compressed) or document (original
    # bytes, which preserves the steganography payload).
    # Will hold Telegram's file id for the attached image, if any
    image_file_id = None
    # MIME type of the attached image
    mime_type = None
    # "photo" posts are re-encoded by Telegram (stego payload usually lost)
    if post.get("photo"):
        # Telegram sends multiple sizes; the last entry is the largest
        image_file_id = post["photo"][-1]["file_id"]  # largest size
        # Telegram serves photos as JPEG
        mime_type = "image/jpeg"
    # "document" posts keep the original bytes (stego payload survives)
    document = post.get("document")
    # Only treat documents that are actually images
    if document and (document.get("mime_type") or "").startswith("image/"):
        # Use the document's file id instead
        image_file_id = document["file_id"]
        # Preserve the document's real MIME type
        mime_type = document.get("mime_type")

    # Candidate URLs to decode: links shared in the text (e.g. the Supabase
    # link of the encoded image), any extra URLs from the caller, and the
    # attached image itself (last resort - photos are re-encoded).
    # Start with every http(s) link found in the text, stripping trailing punctuation
    candidate_urls = [
        url.rstrip(").,")
        for url in re.findall(r"https?://\S+", text)
    ]
    # Append caller-supplied URLs (e.g. the original encoded image)
    for url in extra_urls or []:
        # Avoid duplicates — decode attempts are not free
        if url not in candidate_urls:
            # Add the caller's URL to the candidate list
            candidate_urls.append(url)

    # Telegram file path for the attached image (resolved below)
    file_path = None
    # If an image is attached, resolve its download path via getFile
    if image_file_id:
        # Ask Telegram where the file lives
        file_resp = requests_lib.get(
            # Bot API getFile endpoint
            f"https://api.telegram.org/bot{token}/getFile",
            # Identify the file by its id
            params={"file_id": image_file_id},
            # Short timeout — this is a small metadata call
            timeout=30,
        )
        # Parse the JSON reply
        file_payload = file_resp.json()
        # Only proceed when Telegram confirmed the file exists
        if file_payload.get("ok"):
            # Relative path that can be appended to the file download URL
            file_path = file_payload["result"]["file_path"]
            # Full download URL added as the last-resort decode candidate
            candidate_urls.append(
                f"https://api.telegram.org/file/bot{token}/{file_path}"
            )

    # Attempt LSB decoding across every candidate URL in priority order
    decoded_from, decoded_text = _decode_image_urls(candidate_urls)
    # Never expose the bot token (embedded in Telegram file URLs) to clients
    if decoded_from and "api.telegram.org" in decoded_from:
        # Replace the raw URL with a safe label
        decoded_from = "channel image (Telegram)"  # never leak the bot token

    # Build the document that the dashboard will read
    report = {
        # Channel id (for grouping/filtering)
        "chat_id": chat.get("id"),
        # Channel display title
        "chat_title": chat.get("title"),
        # Channel @username
        "chat_username": chat.get("username"),
        # Message id within the channel
        "message_id": message_id,
        # Resolved author name
        "author": author,
        # Text/caption content
        "text": text,
        # Whether an image was attached
        "has_image": bool(image_file_id),
        # Telegram file path (used by the image proxy endpoint)
        "file_path": file_path,
        # MIME type of the attached image
        "mime_type": mime_type,
        # URL the hidden message was decoded from (sanitized)
        "decoded_from": decoded_from or None,
        # The recovered hidden message ("" when none)
        "decoded_text": decoded_text,
        # Convenience flag for the UI
        "has_message": bool(decoded_text),
        # Telegram's unix timestamp for the post
        "telegram_date": post.get("date"),
    }
    # Upsert: insert if new, overwrite if the post was re-indexed
    collection.update_one(
        # Match on the (chat, message) pair
        {"chat_id": chat.get("id"), "message_id": message_id},
        # Replace stored fields with the freshly computed report
        {"$set": report},
        # Create the document when no match exists
        upsert=True,
    )


def _poll_telegram_channel(requests_lib, token):
    """Pull new channel posts via getUpdates and index them."""
    # Ask Telegram for channel_post updates received since the last poll
    response = requests_lib.get(
        # Bot API getUpdates endpoint
        f"https://api.telegram.org/bot{token}/getUpdates",
        params={
            # Start after the last update we processed
            "offset": TELEGRAM_OFFSET["value"],
            # Long-polling disabled (timeout=0) — this is a quick poll
            "timeout": 0,
            # Fetch up to 100 updates per call
            "limit": 100,
            # Subscribe only to channel posts (ignore private chats etc.)
            "allowed_updates": json.dumps(["channel_post"]),
        },
        # Short timeout keeps the dashboard responsive
        timeout=30,
    )
    # Parse Telegram's JSON reply
    payload = response.json()
    # ok=false means the token is bad or the API rejected the call
    if not payload.get("ok"):
        # Raise so the caller returns a 502 with Telegram's description
        raise Exception(
            f"Telegram getUpdates failed: {payload.get('description', 'unknown error')}"
        )

    # Track the highest update id seen (starting just below the current offset)
    max_update_id = TELEGRAM_OFFSET["value"] - 1
    # Process every update Telegram returned
    for update in payload.get("result", []):
        # Keep the running maximum up to date
        max_update_id = max(max_update_id, update["update_id"])
        # Only channel_post updates contain channel messages
        post = update.get("channel_post")
        # Index each new channel post (idempotent)
        if post:
            # Decode + store the post
            _store_channel_post(
                _db()["telegram_reports"], requests_lib, token, post
            )
    # Advance the offset so these updates are never delivered again
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
