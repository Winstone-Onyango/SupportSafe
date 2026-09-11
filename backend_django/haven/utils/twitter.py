# os reads the Twitter/X credentials from the environment
import os

# requests downloads the image that will be attached to the tweet
import requests
# tweepy is the official Twitter/X API client (v1.1 media + v2 tweets)
import tweepy
# python-dotenv loads .env variables (TWITTER_* keys)
from dotenv import load_dotenv

# Load environment variables from the .env file at import time
load_dotenv()

# Campaign hashtag monitored for SOS reports from the community
DEFAULT_HASHTAG = "IloveSupportSafe"


class TwitterAPIError(Exception):
    """Raised when posting to Twitter fails."""


def _posting_clients():
    """OAuth 1.0a clients used for posting tweets with media."""
    # Consumer key/secret identify the SupportSafe X app
    CONSUMER_KEY = os.getenv("TWITTER_CONSUMER_KEY")
    # (second half of the app credentials pair)
    CONSUMER_SECRET = os.getenv("TWITTER_CONSUMER_SECRET")
    # Access token/secret identify the account that posts
    ACCESS_KEY = os.getenv("TWITTER_ACCESS_TOKEN")
    # (second half of the account credentials pair)
    ACCESS_SECRET = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
    # Bearer token authorises read/search on v2 endpoints
    BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")

    # Build the OAuth 1.0a handler with the app credentials
    auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
    # Attach the account's access token so actions post as that user
    auth.set_access_token(
        ACCESS_KEY,
        ACCESS_SECRET,
    )
    # v2 client able to create tweets (needs both app and account credentials)
    newapi = tweepy.Client(
        bearer_token=BEARER_TOKEN,
        access_token=ACCESS_KEY,
        access_token_secret=ACCESS_SECRET,
        consumer_key=CONSUMER_KEY,
        consumer_secret=CONSUMER_SECRET,
    )
    # v1.1 API client — still the only way to upload media attachments
    api = tweepy.API(auth)
    # Return both clients to the caller
    return newapi, api


def _search_client():
    """Bearer-token client used for reading/searching tweets."""
    # Read-only access requires just the app bearer token
    bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
    # Searching is impossible without it — fail with instructions
    if not bearer_token:
        # Explain the exact fix in the raised error
        raise TwitterAPIError(
            "TWITTER_BEARER_TOKEN is not configured. Add it to your .env file "
            "to enable hashtag monitoring."
        )
    # Build the read-only client; auto-wait when the rate limit is hit
    return tweepy.Client(bearer_token=bearer_token, wait_on_rate_limit=True)


def search_posts_by_hashtag(hashtag=DEFAULT_HASHTAG, max_results=25):
    """Search recent tweets containing the hashtag (with images).

    Returns a list of dicts: {tweet_id, author, text, image_url, created_at}.
    Raises TwitterAPIError when credentials are missing or the search fails.
    """
    # The API rejects values below 10 or above 100 — clamp the caller's request
    max_results = max(10, min(int(max_results), 100))  # API minimum is 10
    # Build the read-only search client (raises if no bearer token)
    client = _search_client()
    # Network/API failures are converted to our own exception type
    try:
        # Query recent tweets: hashtag only, no retweets, must include images
        response = client.search_recent_tweets(
            # The search query with media filters
            query=f"#{hashtag} -is:retweet has:images",
            # Extra tweet fields needed to read text/timestamps/URL entities
            tweet_fields=["created_at", "text", "entities"],
            # Expansions pull the author profile and attached media objects
            expansions=["author_id", "attachments.media_keys"],
            # We need the direct/preview image URLs from the media objects
            media_fields=["url", "preview_image_url"],
            # How many tweets to request
            max_results=max_results,
        )
    # Any API error becomes a TwitterAPIError for the view layer
    except Exception as e:
        # Re-raise with the underlying message
        raise TwitterAPIError(str(e))

    # No tweets matched the query
    if response.data is None:
        # Return an empty result set
        return []

    # Index the expanded user objects by id for O(1) author lookups
    users = {u["id"]: u for u in (response.includes.get("users", []) if response.includes else [])}
    # Index the expanded media objects by key for O(1) image lookups
    media = {m["media_key"]: m for m in (response.includes.get("media", []) if response.includes else [])}

    # Accumulator for the normalised post dicts
    posts = []
    # Convert each raw tweet object into our simple schema
    for tweet in response.data:
        # Look up the author's profile from the expansions
        author = users.get(tweet.author_id, {})
        # Will hold the first image URL found on this tweet
        image_url = None
        # Safely read the tweet's attached media keys
        media_keys = (tweet.attachments or {}).get("media_keys", []) if tweet.attachments else []
        # Find the first usable image among the attachments
        for key in media_keys:
            # Fetch the media object for this key
            m = media.get(key)
            # Skip missing/expired media entries
            if m is not None:
                # Prefer the full-resolution URL, falling back to the preview
                image_url = m.get("url") or m.get("preview_image_url")
                # Stop as soon as we have one image
                if image_url:
                    # Exit the media loop
                    break
        # Also collect URLs shared in the tweet text (e.g. the Supabase link of
        # the encoded image) so the decoder can try the original, un-re-encoded file.
        # X often re-compresses uploaded media, which destroys steganography data,
        # so the original hosted URL in the tweet text is the reliable source.
        extra_urls = []
        # entities.urls holds every link X detected in the tweet text
        entities = tweet.entities or {}
        # Collect each expanded (full) URL
        for u in entities.get("urls", []):
            # Prefer the un-shortened expanded_url over the t.co wrapper
            expanded = u.get("expanded_url") or u.get("url")
            # Keep only non-empty links
            if expanded:
                # Add to the list of candidate image hosts
                extra_urls.append(expanded)
        # Append the normalised post to the results
        posts.append(
            {
                # Tweet id as a string (JS numbers lose precision on 64-bit ids)
                "tweet_id": str(tweet.id),
                # Author handle or a placeholder
                "author": author.get("username", "unknown"),
                # Full tweet text
                "text": tweet.text,
                # First attached image URL (may be None)
                "image_url": image_url,
                # All links found in the tweet text
                "extra_urls": extra_urls,
                # ISO-8601 timestamp for display/sorting
                "created_at": tweet.created_at.isoformat() if tweet.created_at else None,
            }
        )
    # Hand the normalised posts back to the view layer
    return posts


def send_message_to_twitter(image_url, caption):
    # Get the v2 tweet client and the v1.1 media client together
    newapi, api = _posting_clients()
    # Download the image from the URL
    # Fetch the image bytes that will be attached to the tweet
    image_response = requests.get(image_url)

    # A non-200 response means we can't attach anything — fail loudly
    if image_response.status_code != 200:
        # Raise with a short, clear reason
        raise TwitterAPIError("Failed to download the image")

    # Save the image to a temporary file
    # Tweepy's v1.1 media_upload works best from a real file on disk
    image_path = "temp_image.png"
    # Write the downloaded bytes to the temp file
    with open(image_path, "wb") as file:
        # Dump the raw image payload
        file.write(image_response.content)

    # Posting involves two API calls; any failure becomes TwitterAPIError
    try:
        # Upload the media using the v1.1 API
        # Upload and receive a media object holding the new media_id
        media = api.media_upload(image_path)

        # Create the tweet using the v2 API
        # Publish the tweet with the caption text and the uploaded image attached
        post_result = newapi.create_tweet(text=caption, media_ids=[media.media_id])
        # Return a success payload including the API's result data
        return {"message": "Tweet posted successfully", "data": post_result}

    # Any exception during upload/post is normalised for the view layer
    except Exception as e:
        # Re-raise with the underlying message
        raise TwitterAPIError(str(e))

    # The temp file must be removed whether the post succeeded or failed
    finally:
        # Clean up the temporary image file
        # Only delete if the file actually exists on disk
        if os.path.exists(image_path):
            # Remove the temp file so we don't leak disk space per request
            os.remove(image_path)
