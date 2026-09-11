"""Image generation with Pollinations.AI (free, no API key), stored in Supabase Storage."""
# io.BytesIO lets us convert raw image bytes into PIL-saveable streams
import io
# os reads Supabase credentials from the environment
import os
# random picks a different seed per image so results vary
import random
# time spaces out requests to respect the free-tier rate limit
import time
# urllib.error exposes HTTPError for retry logic
import urllib.error
# urllib.parse URL-encodes the prompt safely into the request URL
import urllib.parse
# urllib.request performs the actual HTTP GET without extra dependencies
import urllib.request

# bson.ObjectId generates unique storage keys for uploaded images
from bson import ObjectId
# supabase client uploads bytes to Supabase Storage buckets
from supabase import create_client


def _get_supabase():
    # Read the project URL from the environment
    supabase_url = os.getenv("SUPABASE_URL")
    # Read the (service-role) API key from the environment
    supabase_key = os.getenv("SUPABASE_KEY")
    # If either credential is missing, image storage is simply unavailable
    if not supabase_url or not supabase_key:
        # Signal "not configured" so callers can raise a clear error
        return None
    # Build and return an authenticated Supabase client
    return create_client(supabase_url, supabase_key)


def _pollinations_fetch(url, attempts=3):
    """Fetch a Pollinations image, retrying with backoff on rate limits."""
    # Remember the most recent error so it can be re-raised after the final attempt
    last_err = None
    # Try the request up to `attempts` times
    for attempt in range(attempts):
        # Each attempt is individually error-handled
        try:
            # Build the GET request with a descriptive User-Agent header
            req = urllib.request.Request(
                url, headers={"User-Agent": "SupportSafe/1.0"}
            )
            # Open the URL with a generous 120s timeout (image generation is slow)
            with urllib.request.urlopen(req, timeout=120) as resp:
                # Return the raw image bytes on success
                return resp.read()
        # HTTP-level failures (4xx/5xx) are handled specially
        except urllib.error.HTTPError as e:
            # Save the error in case every attempt fails
            last_err = e
            # Retry only on rate-limit/server errors and only if attempts remain
            if e.code in (429, 502, 503, 504) and attempt < attempts - 1:
                # Linear backoff: 12s, 24s, ... — generous for free-tier limits
                wait = 12 * (attempt + 1)
                # Log the retry so operators can see throttling in the console
                print(f"Pollinations rate limited ({e.code}); retrying in {wait}s")
                # Sleep before the next attempt
                time.sleep(wait)
            else:
                # Non-retryable error, or attempts exhausted — raise immediately
                raise
    # Should only be reached if every attempt failed with a retryable error
    raise last_err


def _pollinations_image_bytes(prompt, max_images=2):
    """Generate images with Pollinations.AI (free, no API key).

    Requests are made sequentially with a small gap to stay under the
    free-tier rate limit (concurrent requests return HTTP 429).
    Returns a list of raw bytes.
    """
    # Percent-encode the prompt so spaces/newlines are URL-safe
    encoded = urllib.parse.quote(prompt, safe="")
    # Accumulator for the downloaded image payloads
    image_bytes = []
    # Request the desired number of images one at a time
    for i in range(max_images):
        # A random seed makes each image unique even for identical prompts
        seed = random.randint(0, 10**9)
        # Build the Pollinations image URL: 1024x1024, no watermark, flux model
        url = (
            f"https://image.pollinations.ai/prompt/{encoded}"
            f"?width=1024&height=1024&nologo=true&seed={seed}&model=flux"
        )
        # Download this image (with retry/backoff) and keep the bytes
        image_bytes.append(_pollinations_fetch(url))
        # Sleep between requests (but not after the last one) to avoid 429s
        if i < max_images - 1:
            # small gap between requests (free-tier rate limit)
            time.sleep(3)  # small gap between requests (free-tier rate limit)

    # Filter out any empty/failed downloads
    image_bytes = [data for data in image_bytes if data]
    # If nothing was generated, fail loudly so views can report it
    if not image_bytes:
        # Raise with a clear message for the caller
        raise RuntimeError("Pollinations returned no images")
    # Hand the raw image bytes back to the caller
    return image_bytes


def upload_image_bytes_to_supabase(image_data, content_type="image/png"):
    """Upload raw image bytes to Supabase Storage and return the public URL."""
    # Get an authenticated Supabase client (or None when not configured)
    supabase = _get_supabase()
    # Storage is required — fail with an actionable message
    if supabase is None:
        # Tell the operator exactly which env vars to set
        raise RuntimeError(
            "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_KEY in your .env file."
        )
    # Bucket name from env with a sensible default
    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "generated-images")
    # Unique object key: a fresh ObjectId keeps collisions impossible
    image_key = f"{ObjectId()}.png"
    # Upload the raw bytes with the right content type so browsers render them
    supabase.storage.from_(bucket).upload(
        # Destination path inside the bucket
        path=image_key,
        # The image payload
        file=image_data,
        # MIME type metadata for the stored object
        file_options={"content-type": content_type},
    )
    # Return the publicly accessible URL of the stored image
    return supabase.storage.from_(bucket).get_public_url(image_key)


def generate_image_urls(prompt, max_images=2):
    """Generate images for a prompt with Pollinations.AI (free, fast) and
    upload them to Supabase Storage.

    Returns a list of public URLs. Raises RuntimeError when storage or the
    image provider is unavailable so views can surface a clear error.
    """
    # PIL is imported lazily because it's only needed for the PNG re-encode
    from PIL import Image

    # Ensure Supabase credentials exist before doing any generation work
    supabase = _get_supabase()
    # Without storage there is nowhere to host the images
    if supabase is None:
        # Raise with the exact fix the operator needs
        raise RuntimeError(
            "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_KEY in your .env file."
        )

    # Resolve the target bucket (default matches the Supabase setup guide)
    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "generated-images")

    # Generate the requested number of raw images (with retry/backoff inside)
    image_bytes = _pollinations_image_bytes(prompt, max_images)

    # Public URLs collected for the response payload
    image_urls = []
    # Convert + upload each generated image
    for data in image_bytes[:max_images]:
        # In-memory buffer to receive the re-encoded PNG
        img_buffer = io.BytesIO()
        # Decode whatever format came back and re-save as a normalised RGB PNG
        Image.open(io.BytesIO(data)).convert("RGB").save(img_buffer, format="PNG")
        # Extract the PNG bytes from the buffer
        image_data = img_buffer.getvalue()
        # Unique storage key for this image
        image_key = f"{ObjectId()}.png"
        # Upload the normalised PNG to Supabase
        supabase.storage.from_(bucket).upload(
            # Destination path inside the bucket
            path=image_key,
            # PNG payload
            file=image_data,
            # Correct MIME type for browsers
            file_options={"content-type": "image/png"},
        )
        # Record the public URL for the API response
        image_urls.append(supabase.storage.from_(bucket).get_public_url(image_key))
    # Log how many images were produced for observability
    print(f"Generated {len(image_urls)} image(s) via pollinations")
    # Give the list of URLs back to the view layer
    return image_urls
