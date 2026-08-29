from django.http import HttpResponse


class CorsMiddleware:
    """Minimal CORS middleware so the Next.js frontend can call this API."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.conf import settings

        origin = getattr(settings, "FRONTEND_ORIGIN", "http://localhost:3000")
        if request.method == "OPTIONS":
            response = HttpResponse()
            response.status_code = 204
        else:
            response = self.get_response(request)
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response["Access-Control-Allow-Credentials"] = "true"
        return response
