# os is used to walk the docs directory
import os
# BytesIO wraps raw HTTP image bytes so PIL can open them like a file
from io import BytesIO

# requests downloads images hosted at a URL
import requests
# bson.ObjectId is MongoDB's 12-byte document identifier type
from bson import ObjectId
# PIL (Pillow) is used to load and manipulate images
from PIL import Image


# Utility functions
def serialize_object_id(document):
    """Recursively convert ObjectId to string in MongoDB documents."""
    # For dictionaries, rebuild the dict with every value serialized
    if isinstance(document, dict):
        # Walk each key/value; recurse when the value is itself a dict or an ObjectId
        return {
            k: serialize_object_id(v) if isinstance(v, (dict, ObjectId)) else v
            for k, v in document.items()
        }
    # For lists/tuples, recurse over every element
    if isinstance(document, (list, tuple)):
        # Return a new list with all ObjectIds (and nested containers) converted
        return [serialize_object_id(item) for item in document]
    # A bare ObjectId is not JSON serializable, so convert it to its hex string
    if isinstance(document, ObjectId):
        # e.g. ObjectId("65a1...") -> "65a1..."
        return str(document)
    # Anything else (str/int/float/datetime/None) passes through untouched
    return document


def load_image_from_url_or_file(img_url=None, file=None):
    # Guard against ambiguous input: the caller must give exactly one source
    if img_url and file:
        # Raise a clear error rather than guessing which source to use
        raise ValueError("Provide either an image URL or file, not both.")
    # Case 1: image is hosted somewhere — download its raw bytes
    if img_url:
        # Fetch bytes over HTTP, wrap in BytesIO, and let PIL decode the image
        return Image.open(BytesIO(requests.get(img_url).content))
    # Case 2: caller passed an uploaded file-like object directly
    if file:
        # PIL can open file objects (e.g. Django InMemoryUploadedFile) directly
        return Image.open(file)
    # No image supplied: fall back to a plain placeholder so text can still
    # be encoded (used when message encoding happens without a generated image).
    # Create an 800x600 solid-blue canvas (RGB 37,99,235) as the carrier image
    return Image.new("RGB", (800, 600), (37, 99, 235))


# Function to read files from the docs directory with improved error handling.
# PDF files are parsed via PyPDF (pypdf) so embeddings are generated from real
# text; other files are read as UTF-8/latin-1 text.
def read_files_from_directory(directory: str):
    # Accumulator for (filename, text_content) tuples
    file_contents = []
    # Iterate over every entry in the given directory
    for filename in os.listdir(directory):
        # Build the full path of this entry
        file_path = os.path.join(directory, filename)
        # Skip subdirectories — only regular files are readable documents
        if not os.path.isfile(file_path):
            # Move on to the next entry
            continue
        # Wrap reading in try/except so one bad file doesn't kill the whole upload
        try:
            # PDFs need a real parser to extract text from the binary format
            if filename.lower().endswith(".pdf"):
                # Import lazily so pypdf is only required when PDFs exist
                from pypdf import PdfReader

                # Open the PDF and prepare a page reader
                reader = PdfReader(file_path)
                # Extract text page by page and join with newlines, skipping empty pages
                content = "\n".join(
                    page.extract_text() for page in reader.pages if page.extract_text()
                )
            # Non-PDF files are plain text
            else:
                # Open as UTF-8 text (most common encoding)
                with open(file_path, "r", encoding="utf-8") as file:
                    # Slurp the whole file into a string
                    content = file.read()
            # Only keep files that actually yielded some text
            if content.strip():
                # Append the (name, content) pair for embedding later
                file_contents.append((filename, content))
        # Handle files that can't be read as UTF-8/PDF
        except Exception:
            # Warn and try a more permissive encoding
            print(f"Error reading {filename} as UTF-8. Trying a different encoding...")
            # Second attempt with latin-1, which never fails to decode any byte
            try:
                # Re-open the file with latin-1 encoding
                with open(file_path, "r", encoding="latin-1") as file:
                    # Read the raw text
                    content = file.read()
                # Keep it only if there is usable content
                if content.strip():
                    # Append the recovered (name, content) pair
                    file_contents.append((filename, content))
            # Both encodings failed — give up on this file but keep going
            except Exception as e:
                # Report the file that was skipped and why
                print(
                    f"Failed to read {filename} with both UTF-8 and latin-1 encodings. Error: {e}"
                )
    # Hand back everything that was successfully read
    return file_contents

