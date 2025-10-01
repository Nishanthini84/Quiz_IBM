#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Get the directory where this script is located
script_dir = Path(__file__).parent.absolute()
os.chdir(script_dir)

PORT = 8001

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def start_server():
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print("=" * 60)
            print("🚀 QUIZ WEB APPLICATION SERVER STARTED")
            print("=" * 60)
            print(f"📍 Server running at: http://localhost:{PORT}")
            print(f"📁 Serving files from: {script_dir}")
            print("=" * 60)
            print("🌐 Opening browser automatically...")
            print("💡 Press Ctrl+C to stop the server")
            print("=" * 60)
            
            # Open browser automatically
            webbrowser.open(f'http://localhost:{PORT}/index.html')
            
            # Start serving
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"❌ Port {PORT} is already in use. Please try again in a moment.")
        else:
            print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    start_server()