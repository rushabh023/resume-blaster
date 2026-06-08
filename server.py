#!/usr/bin/env python3
"""
Resume Blaster — local web server for one-click send from the browser.
Run once:  python server.py
Open:      http://localhost:8765
"""

import json
import os
import threading
import uuid
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from email_core import run_bulk_send

PORT = 8765
ROOT = Path(__file__).resolve().parent

jobs = {}
jobs_lock = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, code: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json(200, {"ok": True, "port": PORT})
            return

        if path == "/api/status":
            params = parse_qs(parsed.query)
            job_id = params.get("job_id", [None])[0]
            with jobs_lock:
                job = jobs.get(job_id)
            if not job:
                self._send_json(404, {"error": "Job not found"})
                return
            self._send_json(200, job)
            return

        if path in ("/", "/index.html"):
            self._serve_file("index.html", "text/html; charset=utf-8")
            return

        if path in ("/setup-guide.html", "/setup"):
            self._serve_file("setup-guide.html", "text/html; charset=utf-8")
            return

        if path.startswith("/docs/"):
            rel = path.lstrip("/")
            file_path = ROOT / rel.replace("/", os.sep)
            if file_path.exists() and file_path.is_file():
                ctype = "image/png" if rel.endswith(".png") else "application/octet-stream"
                self._serve_path(file_path, ctype)
                return

        self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path != "/api/send":
            self._send_json(404, {"error": "Not found"})
            return

        try:
            config = self._read_json()
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        is_test = bool(config.pop("is_test", False))
        job_id = str(uuid.uuid4())

        with jobs_lock:
            jobs[job_id] = {
                "current": 0,
                "total": 1 if is_test else len(config.get("recipients", [])),
                "logs": [],
                "done": False,
                "sent": 0,
                "failed": 0,
                "error": None,
                "is_test": is_test,
            }

        def progress(data):
            entry = data["log"]
            with jobs_lock:
                job = jobs[job_id]
                job["current"] = data["current"]
                job["total"] = data["total"]
                job["logs"].append(entry)
                if entry["success"]:
                    job["sent"] += 1
                else:
                    job["failed"] += 1

        def worker():
            try:
                result = run_bulk_send(config, progress_callback=progress, is_test=is_test)
                with jobs_lock:
                    jobs[job_id]["done"] = True
                    jobs[job_id]["sent"] = result["sent"]
                    jobs[job_id]["failed"] = result["failed"]
            except Exception as e:
                with jobs_lock:
                    jobs[job_id]["done"] = True
                    jobs[job_id]["error"] = str(e)

        threading.Thread(target=worker, daemon=True).start()
        self._send_json(200, {"job_id": job_id})

    def _serve_path(self, file_path: Path, content_type: str):
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _serve_file(self, name: str, content_type: str):
        file_path = ROOT / name
        if not file_path.exists():
            self._send_json(404, {"error": f"{name} not found"})
            return
        self._serve_path(file_path, content_type)


def main():
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    url = f"http://localhost:{PORT}"
    print("=" * 50)
    print("  Resume Blaster — local server running")
    print(f"  Open in browser: {url}")
    print("  Keep this window open while sending emails.")
    print("  Press Ctrl+C to stop.")
    print("=" * 50)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
