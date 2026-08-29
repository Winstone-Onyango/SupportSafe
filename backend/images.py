"""Image generation via the modern google-genai SDK, stored in Supabase Storage."""
import io
import os

from bson import ObjectId
from supabase import create_client


def _get_supabase():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        return None
    return create_client(supabase_url, supabase_key)


def generate_image_urls(prompt, max_images=3):
    """Generate images for a prompt and upload them to Supabase Storage.

    Returns a list of public URLs. Raises RuntimeError when storage or the
    image model is unavailable so views can surface a clear error.
    """
    from google import genai as genai_client
    from google.genai import types as genai_types
    from PIL import Image

    supabase = _get_supabase()
    if supabase is None:
        raise RuntimeError(
            "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_KEY in your .env file."
        )

    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "generated-images")

    image_sdk = genai_client.Client(api_key=os.getenv("GEMINI_API_KEY"))
    resp = image_sdk.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=prompt,
        config=genai_types.GenerateContentConfig(response_modalities=["IMAGE"]),
    )

    image_bytes = []
    for cand in resp.candidates:
        for part in cand.content.parts:
            if part.inline_data:
                image_bytes.append(part.inline_data.data)
            if len(image_bytes) >= max_images:
                break

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
    return image_urls