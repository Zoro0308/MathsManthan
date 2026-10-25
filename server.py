"""
Maths Manthan Smart Dev Server
1. Serves static files on port 8000.
2. Real-time dynamic PDF catalog generation on every request to /assets/data/pdf-catalog.json.
3. Smart PDF fallback: If a requested PDF is not found, but a PDF exists in that same directory, automatically rewrites path and serves it!
4. Real-time filesystem watcher in background thread (syncs catalog and chapters data when files are dropped).
5. Disables caching for JSON metadata so browser always gets fresh data.
"""

import os
import sys
import json
import time
import threading
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDFS_DIR = os.path.join(BASE_DIR, 'assets', 'pdfs')
DATA_DIR = os.path.join(BASE_DIR, 'assets', 'data')
CATALOG_PATH = os.path.join(DATA_DIR, 'pdf-catalog.json')
CHAPTERS_PATH = os.path.join(DATA_DIR, 'chapters-data.json')

def sync_catalog():
    try:
        catalog = {}
        for root, dirs, files in os.walk(PDFS_DIR):
            rel_folder = os.path.relpath(root, PDFS_DIR).replace('\\', '/')
            if rel_folder == '.':
                continue
            pdf_files = [f for f in files if f.lower().endswith('.pdf')]
            if pdf_files:
                # If in a complete book folder, prioritize the complete merged edition
                if 'complete' in rel_folder:
                    complete_files = [f for f in pdf_files if 'complete' in f.lower()]
                    if complete_files:
                        primary_pdf = complete_files[0]
                    else:
                        pdf_files.sort(key=lambda x: os.path.getsize(os.path.join(root, x)), reverse=True)
                        primary_pdf = pdf_files[0]
                else:
                    user_files = [f for f in pdf_files if not f.startswith('ncert-') and not f.startswith('books-') and not f.startswith('class-')]
                    if user_files:
                        user_files.sort(key=lambda x: os.path.getsize(os.path.join(root, x)), reverse=True)
                        primary_pdf = user_files[0]
                    else:
                        pdf_files.sort(key=lambda x: os.path.getsize(os.path.join(root, x)), reverse=True)
                        primary_pdf = pdf_files[0]

                rel_path = f'assets/pdfs/{rel_folder}/{primary_pdf}'
                catalog[rel_folder] = rel_path
                catalog[f'{rel_folder}__all'] = [f'assets/pdfs/{rel_folder}/{f}' for f in pdf_files]

        os.makedirs(DATA_DIR, exist_ok=True)
        with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2)

        if os.path.exists(CHAPTERS_PATH):
            with open(CHAPTERS_PATH, 'r', encoding='utf-8') as f:
                ch_data = json.load(f)
            ch_data_changed = False
            for class_key, book_info in ch_data.items():
                folder_prefix = book_info.get('folderPrefix', '')
                for ch in book_info.get('chapters', []):
                    ch_id = ch.get('ch', '')
                    folder_key = f"{folder_prefix}/{ch_id}"
                    if folder_key in catalog:
                        expected_pdf = catalog[folder_key]
                        if ch.get('pdf') != expected_pdf:
                            ch['pdf'] = expected_pdf
                            ch_data_changed = True
            if ch_data_changed:
                with open(CHAPTERS_PATH, 'w', encoding='utf-8') as f:
                    json.dump(ch_data, f, indent=2)

        return catalog
    except Exception as e:
        sys.stderr.write(f"[SERVER SYNC ERROR] {e}\n")
        sys.stderr.flush()
        return {}

def background_watcher():
    while True:
        try:
            sync_catalog()
            time.sleep(2)
        except Exception:
            time.sleep(3)

class SmartHTTPRequestHandler(SimpleHTTPRequestHandler):
    directory = BASE_DIR

    def end_headers(self):
        if self.path.endswith('.json') or 'pdf-catalog' in self.path or 'chapters-data' in self.path:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def check_smart_fallback(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith('/assets/pdfs/') and path.lower().endswith('.pdf'):
            rel_file = urllib.parse.unquote(path.lstrip('/'))
            full_path = os.path.normpath(os.path.join(BASE_DIR, rel_file))
            if not os.path.exists(full_path):
                folder_path = os.path.dirname(full_path)
                if os.path.isdir(folder_path):
                    pdfs = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
                    if pdfs:
                        if 'complete' in folder_path:
                            complete_files = [f for f in pdfs if 'complete' in f.lower()]
                            target_file = complete_files[0] if complete_files else max(pdfs, key=lambda f: os.path.getsize(os.path.join(folder_path, f)))
                        else:
                            user_files = [f for f in pdfs if not f.startswith('ncert-') and not f.startswith('books-') and not f.startswith('class-')]
                            target_file = user_files[0] if user_files else pdfs[0]
                        new_path = path.rsplit('/', 1)[0] + '/' + urllib.parse.quote(target_file)
                        sys.stderr.write(f"[SMART FALLBACK] {path} -> {new_path}\n")
                        sys.stderr.flush()
                        self.path = new_path
                        return True
        return False

    def do_HEAD(self):
        self.check_smart_fallback()
        return super().do_HEAD()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.endswith('pdf-catalog.json'):
            sync_catalog()

        self.check_smart_fallback()
        return super().do_GET()

class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True

def run(port=8000):
    os.chdir(BASE_DIR)
    sync_catalog()
    t = threading.Thread(target=background_watcher, daemon=True)
    t.start()
    server_address = ('', port)
    httpd = ReusableHTTPServer(server_address, SmartHTTPRequestHandler)
    sys.stderr.write(f"Maths Manthan Smart Dev Server running at http://localhost:{port}/\n")
    sys.stderr.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    port = 8000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    run(port)
