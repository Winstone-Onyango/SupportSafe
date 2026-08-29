"""Seed the lawbot knowledge base (doc_embedding) from the PDFs in backend/docs."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from backend.db import get_database, upload_embeddings_to_mongo  # noqa: E402
from backend.utils.common import read_files_from_directory  # noqa: E402


def main():
    docs_dir = ROOT / "backend" / "docs"
    db = get_database()
    if db is None:
        print("ERROR: could not connect to MongoDB. Check MONGO_ENDPOINT in .env")
        sys.exit(1)

    # Start from a clean collection so re-runs don't duplicate chunks
    removed = db["doc_embedding"].delete_many({})
    print(f"Cleared {removed.deleted_count} existing doc_embedding chunks.")

    contents = read_files_from_directory(str(docs_dir))
    if not contents:
        print("ERROR: no readable documents found in", docs_dir)
        sys.exit(1)
    for name, content in contents:
        print(f"Seeding {name} ({len(content)} chars)...")
    upload_embeddings_to_mongo(contents)
    count = db["doc_embedding"].count_documents({})
    print(f"Done. doc_embedding now holds {count} chunks.")


if __name__ == "__main__":
    main()
