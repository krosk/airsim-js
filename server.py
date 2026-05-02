#!/usr/bin/python

import http.server
import socketserver
import subprocess

PORT = 8000

def get_git_version():
    try:
        hash = subprocess.check_output(
            ['git', 'rev-parse', '--short', 'HEAD'],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        date = subprocess.check_output(
            ['git', 'log', '-1', '--format=%cd', '--date=format:%Y-%m-%d'],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        return f"{hash} ({date})"
    except Exception:
        return "unknown"

_version = get_git_version()

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/version':
            body = _version.encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

Handler.extensions_map.update({
    '.wasm': 'application/wasm',
})

httpd = socketserver.TCPServer(("", PORT), Handler)

print("Serving at port", PORT)
httpd.serve_forever()
