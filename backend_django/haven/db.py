# os reads the MongoDB connection string from the environment
import os
# pickle serializes the embedding list into bytes for compact BSON storage
import pickle
# time is used to pause between embedding calls (rate-limit friendly)
import time

# bson.Binary stores raw bytes (pickled embeddings) inside MongoDB documents
from bson import Binary
# python-dotenv loads .env variables (MONGO_ENDPOINT etc.)
from dotenv import load_dotenv
# pymongo is MongoDB's official Python driver
from pymongo import MongoClient

# Embedding helper used when storing culprit descriptions as vectors
from haven.utils.embedding import generate_text_embedding

# Load environment variables from the .env file at import time
load_dotenv()

# Initialize db_client as None globally to cache the connection
# Module-level cache so the same MongoClient is reused for every request
db_client = None


def get_database():
    """
    Connect to the MongoDB database. Caches the connection so that it is reused
    across multiple calls, improving performance by avoiding repeated handshakes.
    """
    # Reference the module-level cache variable
    global db_client
    # Only create a client on the first call; later calls reuse it
    if db_client is None:
        # Wrap connection in try/except so a bad URI doesn't crash the app
        try:
            # Build the client from the MONGO_ENDPOINT env var (MongoDB Atlas URI)
            db_client = MongoClient(os.getenv("MONGO_ENDPOINT"))
            # Confirm the connection in the server logs
            print("Connected to the database")
        # Connection failed — log and signal the caller
        except Exception as e:
            # Print the underlying error for diagnosis
            print("Error connecting to the database:", e)
            # Return None so callers can fail gracefully
            return None
    # Return the database handle, selecting the DB by name (default kept for legacy reasons)
    return db_client[os.getenv("MONGO_DB_NAME", "SheBuilds")]


def insert_data_into_db(
    name, location, contact_info, severity, culprit, relationship_to_culprit, other_info
):
    """
    Inserts a document into the 'complains2' collection of the MongoDB database.
    Reuses the cached database connection.
    """
    # Get the cached database handle
    db = get_database()
    # Bail out early if MongoDB is unreachable
    if db is None:
        # Log the problem instead of raising so the endpoint can return an error
        print("Database connection is not available.")
        # Signal failure to the caller
        return None

    # All reports live in this collection
    collection = db["complains2"]
    # Build the report document from the extracted fields
    document = {
        # Victim's name
        "name": name,
        # Where the abuse is happening
        "location": location,
        # How the victim prefers to be contacted
        "contact_info": contact_info,
        # Severity rating from the decomposition step
        "severity": severity,
        # Description of the perpetrator
        "culprit": culprit,
        # Victim's relationship to the perpetrator
        "relationship_to_culprit": relationship_to_culprit,
        # Anything else extracted from the text
        "other_info": other_info,
        # Every new report starts as "Pending" until an admin closes it
        "status": "Pending",
    }
    # Embed the culprit description for later vector matching
    culprit_embedding = generate_text_embedding(culprit)
    # Attach the embedding vector to the document
    document["culprit_embedding"] = culprit_embedding
    # Wrap the insert so DB hiccups don't crash the endpoint
    try:
        # Write the document to MongoDB
        result = collection.insert_one(document)
        # Log the new document's id
        print(f"Inserted document with ID: {result.inserted_id}")
        # Give the id back to the caller
        return result.inserted_id
    # Insert failed (network, auth, validation)
    except Exception as e:
        # Log the underlying error
        print("Error inserting data:", e)
        # Signal failure to the caller
        return None


# Large documents are split into chunks so that each embedding call stays well
# within the model's input limits (and free-tier per-request caps). Each chunk
# is stored as its own document in the 'doc_embedding' collection.
def _chunk_text(text, size=1200):
    # Normalize None/whitespace-only input to an empty string
    text = (text or "").strip()
    # Empty text produces no chunks
    if not text:
        # Return an empty list immediately
        return []
    # Slice the text into fixed-size windows of `size` characters
    return [text[i : i + size] for i in range(0, len(text), size)]


def upload_embeddings_to_mongo(file_contents):
    # Get the cached database handle
    db = get_database()
    # Lawbot knowledge chunks live in this collection
    collection = db["doc_embedding"]
    # Process each (filename, text) pair produced by read_files_from_directory
    for filename, content in file_contents:
        # Split the document text into embedding-sized chunks
        chunks = _chunk_text(content)
        # Embed and store every chunk individually
        for idx, chunk in enumerate(chunks):
            # Convert this chunk's text into a 768-dim vector
            embedding = generate_text_embedding(chunk)
            # Build the chunk document
            doc = {
                # Source document name (for tracing chunks back to a file)
                "filename": filename,
                # Position of this chunk inside the source document
                "chunk_index": idx,
                # Embedding stored as pickled bytes wrapped in BSON Binary
                "embedding": Binary(pickle.dumps(embedding)),
                # First 500 chars of the chunk for quick previews/debugging
                "content": chunk[:500],
            }
            # Persist the chunk document
            collection.insert_one(doc)
            # Log progress per chunk
            print(f"Uploaded {filename} chunk {idx} to MongoDB.")
            # small delay to respect free-tier rate limits
            time.sleep(0.6)  # small delay to respect free-tier rate limits
