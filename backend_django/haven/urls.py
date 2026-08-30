from django.urls import path

from haven import auth_api, views

urlpatterns = [
    # Auth
    path("auth/register", auth_api.register),
    path("auth/login", auth_api.login),
    path("auth/me", auth_api.me),
    # Core API
    path("text-generation", views.text_generation),
    path("img-generation", views.img_generation),
    path("text-decomposition", views.text_decomposition),
    path("save-extracted-data", views.save_extracted_data),
    path("encode", views.encode),
    path("decode", views.decode),
    path("poem-generation", views.poem_generation),
    path("send-message", views.send_message),
    path("get-admin-posts", views.get_admin_posts),
    path("find-match", views.find_match),
    path("get-post/<str:post_id>", views.get_post),
    path("close-issue/<str:issue_id>", views.close_issue),
    path("upload_embeddings/", views.upload_embeddings),
    path("generate-image", views.generate_image),
    path("encode-image", views.encode_image),
    path("hashtag-reports", views.hashtag_reports),
]
