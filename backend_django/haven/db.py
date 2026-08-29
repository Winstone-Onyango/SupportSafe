import os
import pickle
import time

from bson import Binary
from dotenv import load_dotenv
from pymongo import MongoClient

from haven.utils.embedding import generate_text_embedding

load_dotenv()

# Initialize db_client as None globally to cache the connection
db_client = None


def get_database():
    """
    Connect to the MongoDB database. Caches the connection so that it is reused
    across multiple calls, improving performance by avoiding repeated handshakes.
    """
    global db_client
    if db_client is None:
        try:
            db_client = MongoClient(os.getenv("MONGO_ENDPOINT"))
            print("Connected to the database")
        except Exception as e:
            print("Error connecting to the database:", e)
            return None
    return db_client[os.getenv("MONGO_DB_NAME", "SheBuilds")]


def insert_data_into_db(
    name, location, contact_info, severity, culprit, relationship_to_culprit, other_info
):
    """
    Inserts a document into the 'complains2' collection of the MongoDB database.
    Reuses the cached database connection.
    """
    db = get_database()
    if db is None:
        print("Database connection is not available.")
        return None

    collection = db["complains2"]
    document = {
        "name": name,
        "location": location,
        "contact_info": contact_info,
        "severity": severity,
        "culprit": culprit,
        "relationship_to_culprit": relationship_to_culprit,
        "other_info": other_info,
        "status": "Pending",
    }
    culprit_embedding = generate_text_embedding(culprit)
    document["culprit_embedding"] = culprit_embedding
    try:
        result = collection.insert_one(document)
        print(f"Inserted document with ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print("Error inserting data:", e)
        return None


# Large documents are split into chunks so that each embedding call stays well
# within the model's input limits (and free-tier per-request caps). Each chunk
# is stored as its own document in the 'doc_embedding' collection.
def _chunk_text(text, size=1200):
    text = (text or "").strip()
    if not text:
        return []
    return [text[i : i + size] for i in range(0, len(text), size)]


def upload_embeddings_to_mongo(file_contents):
    db = get_database()
    collection = db["doc_embedding"]
    for filename, content in file_contents:
        chunks = _chunk_text(content)
        for idx, chunk in enumerate(chunks):
            embedding = generate_text_embedding(chunk)
            doc = {
                "filename": filename,
                "chunk_index": idx,
                "embedding": Binary(pickle.dumps(embedding)),
                "content": chunk[:500],
            }
            collection.insert_one(doc)
            print(f"Uploaded {filename} chunk {idx} to MongoDB.")
            time.sleep(0.6)  # small delay to respect free-tier rate limits
