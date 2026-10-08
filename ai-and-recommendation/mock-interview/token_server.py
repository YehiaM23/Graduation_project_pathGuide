"""Simple HTTP server to generate LiveKit room tokens for the frontend."""

import os
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

from dotenv import load_dotenv
from livekit.api import AccessToken, VideoGrants

load_dotenv()

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
FRONTEND_DIR = Path(__file__).parent / "frontend"


class TokenHandler(SimpleHTTPRequestHandler):
    """Serves the frontend and handles token generation."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def do_POST(self):
        if self.path == "/api/token":
            self._handle_token_request()
        else:
            self.send_error(404)

    def _handle_token_request(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        try:
            data = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            self.send_error(400, "Invalid JSON")
            return

        candidate_name = data.get("name", "Candidate")
        room_name = data.get("room", "interview-room")

        # Only allow the designated interview room
        if room_name != "interview-room":
            self.send_error(403, "Invalid room name")
            return

        # Generate a LiveKit access token
        token = (
            AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
            .with_identity(candidate_name)
            .with_name(candidate_name)
            .with_grants(
                VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                )
            )
        )

        response = json.dumps(
            {
                "token": token.to_jwt(),
                "url": LIVEKIT_URL,
            }
        )

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(response.encode())

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


def main():
    port = 3000
    server = HTTPServer(("0.0.0.0", port), TokenHandler)
    print(f"Token server running at http://localhost:{port}")
    print(f"LiveKit URL: {LIVEKIT_URL}")
    server.serve_forever()


if __name__ == "__main__":
    main()
