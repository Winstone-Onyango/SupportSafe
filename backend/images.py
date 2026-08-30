"""Image generation with Pollinations.AI (free, no API key), stored in Supabase Storage."""
import io
import os
import random
import time
import urllib.error
import urllib.parse
import urllib.request

from bson import ObjectId
from supabase import create_client


def _get_supabase():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        return None
    return create_client(supabase_url, supabase_key)


def _pollinations_fetch(url, attempts=3):
    """Fetch a Pollinations image, retrying with backoff on rate limits."""
    last_err = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "SupportSafe/1.0"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            last_err = e
            if e.code in (429, 502, 503, 504) and attempt < attempts - 1:
                wait = 12 * (attempt + 1)
                print(f"Pollinations rate limited ({e.code}); retrying in {wait}s")
                time.sleep(wait)
            else:
                raise
    raise last_err


def _pollinations_image_bytes(prompt, max_images=2):
    """Generate images with Pollinations.AI (free, no API key).

    Requests are made sequentially with a small gap to stay under the
    free-tier rate limit (concurrent requests return HTTP 429).
    Returns a list of raw bytes.
    """
    encoded = urllib.parse.quote(prompt, safe="")
    image_bytes = []
    for i in range(max_images):
        seed = random.randint(0, 10**9)
        url = (
            f"https://image.pollinations.ai/prompt/{encoded}"
            f"?width=1024&height=1024&nologo=true&seed={seed}&model=flux"
        )
        image_bytes.append(_pollinations_fetch(url))
        if i < max_images - 1:
            time.sleep(3)  # small gap between requests (free-tier rate limit)

    image_bytes = [data for data in image_bytes if data]
    if not image_bytes:
        raise RuntimeError("Pollinations returned no images")
    return image_bytes


def generate_image_urls(prompt, max_images=2):
    """Generate images for a prompt with Pollinations.AI (free, fast) and
    upload them to Supabase Storage.

    Returns a list of public URLs. Raises RuntimeError when storage or the
    image provider is unavailable so views can surface a clear error.
    """
    from PIL import Image

    supabase = _get_supabase()
    if supabase is None:
        raise RuntimeError(
            "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_KEY in your .env file."
        )

    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "generated-images")

    image_bytes = _pollinations_image_bytes(prompt, max_images)

    image_urls = []
    for data in image_bytes[:max_images]:
        img_buffer = io.BytesIO()
        Image.open(io.BytesIO(data)).convert("RGB").save(img_buffer, format="PNG")
        image_data = img_buffer.getvalue()
        image_key = f"{ObjectId()}.png"
        supabase.storage.from_(bucket).upload(
            path=image_key,
            file=image_data,
            file_options={"content-type": "image/png"},
        )
        image_urls.append(supabase.storage.from_(bucket).get_public_url(image_key))
    print(f"Generated {len(image_urls)} image(s) via pollinations")
    return image_urls