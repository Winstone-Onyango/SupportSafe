import os
from io import BytesIO

import requests
from bson import Binary, ObjectId
from fastapi import FastAPI, File, HTTPException
from PIL import Image


# Utility functions
def serialize_object_id(document):
    """Recursively convert ObjectId to string in MongoDB documents."""
    if isinstance(document, dict):
        return {
            k: serialize_object_id(v) if isinstance(v, (dict, list, tuple, ObjectId)) else v
            for k, v in document.items()
        }
    if isinstance(document, (list, tuple)):
        return [serialize_object_id(item) for item in document]
    if isinstance(document, ObjectId):
        return str(document)
    return document


def load_image_from_url_or_file(img_url=None, file=None):
    if img_url and file:
        raise HTTPException(
            status_code=400, detail="Provide either an image URL or file, not both."
        )
    if img_url:
        return Image.open(BytesIO(requests.get(img_url).content))
    if file:
        return Image.open(file.file)
    # No image supplied: fall back to a plain placeholder so text can still
    # be encoded (used when message encoding happens without a generated image).
    return Image.new("RGB", (800, 600), (37, 99, 235))


# Function to read files from the docs directory with improved error handling.
# PDF files are parsed via PyPDF (pypdf) so embeddings are generated from real
# text; other files are read as UTF-8/latin-1 text.
def read_files_from_directory(directory: str):
    file_contents = []
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if not os.path.isfile(file_path):
            continue
        try:
            if filename.lower().endswith(".pdf"):
                from pypdf import PdfReader

                reader = PdfReader(file_path)
                content = "\n".join(
                    page.extract_text() for page in reader.pages if page.extract_text()
                )
            else:
                with open(file_path, "r", encoding="utf-8") as file:
                    content = file.read()
            if content.strip():
                file_contents.append((filename, content))
        except Exception:
            print(f"Error reading {filename} as UTF-8. Trying a different encoding...")
            try:
                with open(file_path, "r", encoding="latin-1") as file:
                    content = file.read()
                if content.strip():
                    file_contents.append((filename, content))
            except Exception as e:
                print(
                    f"Failed to read {filename} with both UTF-8 and latin-1 encodings. Error: {e}"
                )
    return file_contents
