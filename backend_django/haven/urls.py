# Import Django's path router for mapping URLs to view functions
from django.urls import path

# Import the authentication views and the main API views from the haven app
from haven import auth_api, views

# Map each endpoint to its handler; all paths are served at the site root (no /api prefix)
urlpatterns = [
    # Auth: create a new user account
    path("auth/register", auth_api.register),
    # Auth: exchange username/password for a bearer token
    path("auth/login", auth_api.login),
    # Auth: return the profile of the token's owner
    path("auth/me", auth_api.me),
    # Core API: expand a victim's short form input into a structured report (Gemini + Gemma)
    path("text-generation", views.text_generation),
    # Core API: generate an illustrative image for a post
    path("img-generation", views.img_generation),
    # Core API: decompose free text into structured key/value fields
    path("text-decomposition", views.text_decomposition),
    # Core API: persist an extracted report as a post in MongoDB
    path("save-extracted-data", views.save_extracted_data),
    # Core API: hide a secret message inside a PNG using steganography
    path("encode", views.encode),
    # Core API: recover a hidden message from a stego PNG
    path("decode", views.decode),
    # Core API: generate a short inspirational poem for victims
    path("poem-generation", views.poem_generation),
    # Core API: post an SOS tweet via the Twitter/X API
    path("send-message", views.send_message),
    # Core API: forward a report to a Telegram chat
    path("send-to-telegram", views.send_to_telegram),
    # Core API: list reports received from the Telegram bot
    path("telegram-reports", views.telegram_reports),
    # Core API: proxy/serve an image attached to a Telegram report
    path("telegram-image", views.telegram_image),
    # Core API: list all posts for the admin dashboard (requires admin token)
    path("get-admin-posts", views.get_admin_posts),
    # Core API: vector-search MongoDB for posts similar to a description
    path("find-match", views.find_match),
    # Core API: fetch a single post by its MongoDB id
    path("get-post/<str:post_id>", views.get_post),
    # Core API: mark an issue/report as resolved
    path("close-issue/<str:issue_id>", views.close_issue),
    # Core API: chunk + embed the lawbot PDFs and store vectors in MongoDB
    path("upload_embeddings/", views.upload_embeddings),
    # Core API: generate images from a text prompt (Supabase storage backed)
    path("generate-image", views.generate_image),
    # Core API: fetch an image URL and return it encoded with a hidden message
    path("encode-image", views.encode_image),
    # Core API: list recent tweets mentioning the campaign hashtag
    path("hashtag-reports", views.hashtag_reports),
]

