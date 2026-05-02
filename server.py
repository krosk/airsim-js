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

with open('version.txt', 'w') as f:
    f.write(get_git_version())

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.wasm': 'application/wasm',
})

httpd = socketserver.TCPServer(("", PORT), Handler)

print("Serving at port", PORT)
httpd.serve_forever()
