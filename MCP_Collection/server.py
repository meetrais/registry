#!/usr/bin/env python3
"""
Simple HTTP server for MCP Collection UI
Serves the UI and proxies requests to the registry API to avoid CORS issues
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import urllib.error
import json
import os
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Load .env file from the same directory as this script
    env_path = Path(__file__).parent / '.env'
    load_dotenv(dotenv_path=env_path)
except ImportError:
    print("Warning: python-dotenv not installed. Install with: pip install python-dotenv")
    print("Falling back to system environment variables only.")

# Registry URL - use environment variable or default to localhost
# For local development: http://localhost:8080
# For Cloud Run: set MCP_REGISTRY_URL in .env file to your Cloud Run registry URL
REGISTRY_URL = os.environ.get('MCP_REGISTRY_URL', 'http://localhost:8080')

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_GET(self):
        # Proxy all /api/* requests to the registry
        if self.path.startswith('/api/'):
            # Convert /api/servers -> /v0/servers
            # Convert /api/health -> /v0/health
            registry_path = self.path.replace('/api/', '/v0/')
            self.proxy_request('GET', registry_path, REGISTRY_URL)
        else:
            # Serve static files normally
            super().do_GET()

    def do_POST(self):
        print(f"[DEBUG] POST request to: {self.path}")
        
        # Proxy all /api/* POST requests to the registry
        if self.path.startswith('/api/'):
            print(f"[DEBUG] Matched /api/ route")
            registry_path = self.path.replace('/api/', '/v0/')
            print(f"[DEBUG] Registry path: {registry_path}")
            print(f"[DEBUG] Registry URL: {REGISTRY_URL}")
            
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            print(f"[DEBUG] Request body length: {len(body) if body else 0}")
            
            self.proxy_request('POST', registry_path, REGISTRY_URL, body)
        # Proxy GitHub OAuth device flow requests
        elif self.path.startswith('/github/'):
            print(f"[DEBUG] Matched /github/ route")
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            
            # Map paths:
            # /github/device/code -> https://github.com/login/device/code
            # /github/oauth/access_token -> https://github.com/login/oauth/access_token
            github_path = self.path.replace('/github/', '/login/')
            print(f"[DEBUG] Proxying to: https://github.com{github_path}")
            self.proxy_request('POST', github_path, 'https://github.com', body)
        else:
            print(f"[DEBUG] No route matched, returning 404")
            self.send_error(404, 'Not Found')

    def proxy_request(self, method, path, base_url, body=None):
        """Proxy a request to the target API"""
        try:
            url = f'{base_url}{path}'
            
            # Build headers
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            # Forward Authorization header if present
            if 'Authorization' in self.headers:
                headers['Authorization'] = self.headers['Authorization']
            
            # Create request
            req = urllib.request.Request(
                url,
                data=body,
                headers=headers,
                method=method
            )
            
            # Make request
            with urllib.request.urlopen(req) as response:
                data = response.read()
                
                self.send_response(response.status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
                
        except urllib.error.HTTPError as e:
            # Forward error response
            error_data = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(error_data)
            
        except Exception as e:
            self.send_error(500, f'Proxy error: {str(e)}')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

if __name__ == '__main__':
    PORT = 5000
    
    print(f"Starting MCP Collection UI server...")
    print(f"Server running at: http://localhost:{PORT}")
    print(f"Registry API at: http://localhost:8080")
    print(f"\nPress Ctrl+C to stop the server\n")
    
    server = HTTPServer(('localhost', PORT), CORSRequestHandler)
    server.serve_forever()
