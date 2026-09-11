# os reads the Gemini API key from the environment
import os

# python-dotenv loads .env variables (MONGO/GEMINI keys etc.)
from dotenv import load_dotenv

# Populate the environment from the .env file at import time
load_dotenv()


def generate_text_embedding(text):
    # Import inside the function so a missing SDK doesn't break app startup
    import google.generativeai as genai

    # Authenticate the Gemini SDK with the key from the environment
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    # Ask Gemini's embedding model to convert the text into a numeric vector
    response = genai.embed_content(
        # Google's text-embedding model (768 dimensions)
        model="models/gemini-embedding-001",
        # The text we want to embed (culprit description or document chunk)
        content=text,
        # "retrieval_document" tunes vectors for similarity search over stored docs
        task_type="retrieval_document",
        # Optional label that can improve embedding quality for doc retrieval
        title="Embedding of culprit info",
        # Fix the vector length at 768 so it matches the MongoDB search index
        output_dimensionality=768,
    )
    # Return the raw embedding list (768 floats)
    return response["embedding"]


def calculate_similarity_percentage(query_vector, result_vector):
    # Calculate Euclidean distance manually
    # Sum squared differences across all dimensions, then take the square root
    distance = sum((q - r) ** 2 for q, r in zip(query_vector, result_vector)) ** 0.5

    # Estimate a maximum possible distance for normalization, e.g., sqrt(768) for 768-dimensional vectors
    # Worst case for unit-scaled vectors: every dimension differs by 1 -> sqrt(n_dimensions)
    max_distance = len(query_vector) ** 0.5

    # Convert distance to a similarity percentage
    # 0 distance = 100% similar; max distance = 0%; clamp negative values to 0
    similarity_percentage = max(0, (1 - distance / max_distance) * 100)
    # Round to 2 decimals for a clean display in the UI
    return round(similarity_percentage, 2)


def find_top_matches(
    collection, description_embedding, num_results=1, num_candidates=100
):
    # Perform a vector search to get the top matches
    # Run a MongoDB Atlas Vector Search aggregation pipeline
    results_cursor = collection.aggregate(
        [
            {
                # Atlas Vector Search stage: find nearest neighbours of the query vector
                "$vectorSearch": {
                    # The document field holding each stored embedding
                    "path": "culprit_embedding",
                    # Name of the Atlas search index created on the collection
                    "index": "culpritIndex2",
                    # The embedding of the description we are matching against
                    "queryVector": description_embedding,
                    # How many results to return
                    "numResults": num_results,
                    # Required for approximate search
                    # How many candidates the search examines before ranking (higher = better recall)
                    "numCandidates": num_candidates,  # Required for approximate search
                    # Must match the embedding size used at write time
                    "numDimensions": 768,  # Specify the dimensionality of the embedding
                    # Distance metric used for ranking
                    "similarity": "euclidean",  # Specify similarity metric
                    # knn = k-nearest-neighbour search
                    "type": "knn",  # Use "knn" for nearest-neighbor search
                    # Cap on documents returned by the stage
                    "limit": num_results,  # Set the limit parameter
                },
            },
            {
                # Project stage: shape the output documents and drop heavy fields
                "$project": {
                    # Replace with the field that contains associated text
                    # Keep the culprit description text
                    "culprit": 1,  # Replace with the field that contains associated text
                    # Include embedding only if needed
                    # Keep the stored embedding so similarity % can be computed per match
                    "culprit_embedding": 1,  # Include embedding only if needed
                    # Include the document ID if useful
                    # Keep the MongoDB id so the UI can link to the full post
                    "_id": 1,  # Include the document ID if useful
                }
            },
        ]
    )

    # Materialize the lazy cursor into a plain list of result documents
    results = list(results_cursor)
    # Return the top matches to the caller (views.py)
    return results

