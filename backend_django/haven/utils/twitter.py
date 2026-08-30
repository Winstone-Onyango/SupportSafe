import os

import requests
import tweepy
from dotenv import load_dotenv

load_dotenv()

DEFAULT_HASHTAG = "IloveSupportSafe"


class TwitterAPIError(Exception):
    """Raised when posting to Twitter fails."""


def _posting_clients():
    """OAuth 1.0a clients used for posting tweets with media."""
    CONSUMER_KEY = os.getenv("TWITTER_CONSUMER_KEY")
    CONSUMER_SECRET = os.getenv("TWITTER_CONSUMER_SECRET")
    ACCESS_KEY = os.getenv("TWITTER_ACCESS_TOKEN")
    ACCESS_SECRET = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
    BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")

    auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
    auth.set_access_token(
        ACCESS_KEY,
        ACCESS_SECRET,
    )
    newapi = tweepy.Client(
        bearer_token=BEARER_TOKEN,
        access_token=ACCESS_KEY,
        access_token_secret=ACCESS_SECRET,
        consumer_key=CONSUMER_KEY,
        consumer_secret=CONSUMER_SECRET,
    )
    api = tweepy.API(auth)
    return newapi, api


def _search_client():
    """Bearer-token client used for reading/searching tweets."""
    bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
    if not bearer_token:
        raise TwitterAPIError(
            "TWITTER_BEARER_TOKEN is not configured. Add it to your .env file "
            "to enable hashtag monitoring."
        )
    return tweepy.Client(bearer_token=bearer_token, wait_on_rate_limit=True)


def search_posts_by_hashtag(hashtag=DEFAULT_HASHTAG, max_results=25):
    """Search recent tweets containing the hashtag (with images).

    Returns a list of dicts: {tweet_id, author, text, image_url, created_at}.
    Raises TwitterAPIError when credentials are missing or the search fails.
    """
    max_results = max(10, min(int(max_results), 100))  # API minimum is 10
    client = _search_client()
    try:
        response = client.search_recent_tweets(
            query=f"#{hashtag} -is:retweet has:images",
            tweet_fields=["created_at", "text", "entities"],
            expansions=["author_id", "attachments.media_keys"],
            media_fields=["url", "preview_image_url"],
            max_results=max_results,
        )
    except Exception as e:
        raise TwitterAPIError(str(e))

    if response.data is None:
        return []

    users = {u["id"]: u for u in (response.includes.get("users", []) if response.includes else [])}
    media = {m["media_key"]: m for m in (response.includes.get("media", []) if response.includes else [])}

    posts = []
    for tweet in response.data:
        author = users.get(tweet.author_id, {})
        image_url = None
        media_keys = (tweet.attachments or {}).get("media_keys", []) if tweet.attachments else []
        for key in media_keys:
            m = media.get(key)
            if m is not None:
                image_url = m.get("url") or m.get("preview_image_url")
                if image_url:
                    break
        # Also collect URLs shared in the tweet text (e.g. the Supabase link of
        # the encoded image) so the decoder can try the original, un-re-encoded file.
        extra_urls = []
        entities = tweet.entities or {}
        for u in entities.get("urls", []):
            expanded = u.get("expanded_url") or u.get("url")
            if expanded:
                extra_urls.append(expanded)
        posts.append(
            {
                "tweet_id": str(tweet.id),
                "author": author.get("username", "unknown"),
                "text": tweet.text,
                "image_url": image_url,
                "extra_urls": extra_urls,
                "created_at": tweet.created_at.isoformat() if tweet.created_at else None,
            }
        )
    return posts


def send_message_to_twitter(image_url, caption):
    newapi, api = _posting_clients()
    # Download the image from the URL
    image_response = requests.get(image_url)

    if image_response.status_code != 200:
        raise TwitterAPIError("Failed to download the image")

    # Save the image to a temporary file
    image_path = "temp_image.png"
    with open(image_path, "wb") as file:
        file.write(image_response.content)

    try:
        # Upload the media using the v1.1 API
        media = api.media_upload(image_path)

        # Create the tweet using the v2 API
        post_result = newapi.create_tweet(text=caption, media_ids=[media.media_id])
        return {"message": "Tweet posted successfully", "data": post_result}

    except Exception as e:
        raise TwitterAPIError(str(e))

    finally:
        # Clean up the temporary image file
        if os.path.exists(image_path):
            os.remove(image_path)
