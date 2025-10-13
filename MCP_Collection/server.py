#!/usr/bin/env python3
"""
Simple HTTP server for MCP Collection UI
Serves the UI and proxies requests to the registry API to avoid CORS issues
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request
import json

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        # Proxy API requests to the registry
        if self.path == '/api/servers':
            try:
                # Fetch from the actual registry API
                with urllib.request.urlopen('http://localhost:8080/v0/servers') as response:
                    data = response.read()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
            except Exception as e:
                self.send_error(500, f'Error fetching from registry: {str(e)}')
        else:
            # Serve static files normally
            super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    PORT = 5000
    
    print(f"Starting MCP Collection UI server...")
    print(f"Server running at: http://localhost:{PORT}")
    print(f"Registry API at: http://localhost:8080")
    print(f"\nPress Ctrl+C to stop the server\n")
    
    server = HTTPServer(('localhost', PORT), CORSRequestHandler)
    server.serve_forever()
