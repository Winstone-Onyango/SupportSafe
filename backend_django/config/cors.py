# Import HttpResponse so we can build a lightweight empty response for CORS preflight requests
from django.http import HttpResponse


class CorsMiddleware:
    """Minimal CORS middleware so the Next.js frontend can call this API."""

    # Django calls this once at startup, passing the next middleware/view in the chain
    def __init__(self, get_response):
        # Store the rest of the request pipeline so we can call it later
        self.get_response = get_response

    # Django calls this for every incoming HTTP request
    def __call__(self, request):
        # Import settings lazily (inside the call) to avoid import-order issues at startup
        from django.conf import settings

        # Read the allowed frontend origin from settings, defaulting to the local Next.js dev server
        origin = getattr(settings, "FRONTEND_ORIGIN", "http://localhost:3000")
        # Browsers send an OPTIONS "preflight" before cross-origin POSTs with JSON/auth headers
        if request.method == "OPTIONS":
            # Answer preflight immediately with an empty response
            response = HttpResponse()
            # 204 No Content tells the browser the preflight succeeded
            response.status_code = 204
        # Any real request (GET/POST/...) continues down the normal pipeline
        else:
            # Call the view (or next middleware) to produce the actual response
            response = self.get_response(request)
        # Tell the browser which origin is allowed to read this response
        response["Access-Control-Allow-Origin"] = origin
        # Allow the headers the frontend sends on cross-origin calls (JSON body + bearer token)
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        # Allow all the HTTP verbs the API uses
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        # Permit cookies/credentials to be included in cross-origin requests
        response["Access-Control-Allow-Credentials"] = "true"
        # Return the response (now decorated with CORS headers) to the browser
        return response

