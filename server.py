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

import re

def format_size(bytes_sz):
    if bytes_sz < 1024 * 1024:
        return f"{bytes_sz / 1024:.0f} KB"
    return f"{bytes_sz / (1024 * 1024):.1f} MB"

def classify_pdf(filename, full_path, rel_folder):
    fn_lower = filename.lower()
    sz = os.path.getsize(full_path)
    
    is_starter = bool(re.match(r'^class-?\d+-ch-?\d+\.pdf$', fn_lower)) and sz < 25000
    if is_starter:
        return None
        
    if any(k in fn_lower for k in ['solution', 'sol', 'ans', 'key', 'marking']):
        m = re.search(r'test[-_\s]*(\d+)', fn_lower)
        num = m.group(1) if m else ''
        title = f"Class Test {num} — Solutions / Answer Key" if num else "Solutions & Answer Key"
        code = f"TEST-{int(num):02d}-SOL" if num else "SOLUTIONS"
        order = (int(num) * 10 + 2) if num else 95
        return {
            'name': filename,
            'path': f'assets/pdfs/{rel_folder}/{filename}',
            'title': title,
            'code': code,
            'badge': 'Answer Key',
            'type': 'solution',
            'size': format_size(sz),
            'order': order
        }
        
    if 'test' in fn_lower:
        m = re.search(r'test[-_\s]*(\d+)', fn_lower)
        num = m.group(1) if m else ''
        title = f"Class Test {num}" if num else "Chapter Practice Test"
        code = f"TEST-{int(num):02d}" if num else "TEST"
        order = (int(num) * 10 + 1) if num else 50
        return {
            'name': filename,
            'path': f'assets/pdfs/{rel_folder}/{filename}',
            'title': title,
            'code': code,
            'badge': 'Test Paper',
            'type': 'test',
            'size': format_size(sz),
            'order': order
        }
        
    clean_name = re.sub(r'^(class\d+-ch\d+-|ncert-class-\d+-ch-\d+-)', '', fn_lower)
    clean_name = clean_name.replace('.pdf', '').replace('-', ' ').title()
    title = f"Chapter Notes: {clean_name}" if clean_name and len(clean_name) > 3 else "Chapter Study Material & Theory"
    return {
        'name': filename,
        'path': f'assets/pdfs/{rel_folder}/{filename}',
        'title': title,
        'code': 'CHAPTER NOTES',
        'badge': 'Study Material',
        'type': 'material',
        'size': format_size(sz),
        'order': 0
    }

def sync_catalog():
    try:
        catalog = {}
        for root, dirs, files in os.walk(PDFS_DIR):
            rel_folder = os.path.relpath(root, PDFS_DIR).replace('\\', '/')
            if rel_folder == '.':
                continue
            pdf_files = [f for f in files if f.lower().endswith('.pdf')]
            if pdf_files:
                classified_items = []
                for f in pdf_files:
                    full_p = os.path.join(root, f)
                    item = classify_pdf(f, full_p, rel_folder)
                    if item:
                        classified_items.append(item)

                if not classified_items:
                    f0 = sorted(pdf_files)[0]
                    full_p = os.path.join(root, f0)
                    classified_items = [{
                        'name': f0,
                        'path': f'assets/pdfs/{rel_folder}/{f0}',
                        'title': 'Chapter Study Material',
                        'code': 'CHAPTER NOTES',
                        'badge': 'Study Material',
                        'type': 'material',
                        'size': format_size(os.path.getsize(full_p)),
                        'order': 0
                    }]

                classified_items.sort(key=lambda x: x['order'])
                materials = [i for i in classified_items if i['type'] == 'material']
                primary_item = materials[0] if materials else classified_items[0]

                catalog[rel_folder] = primary_item['path']
                catalog[f'{rel_folder}__all'] = [f'assets/pdfs/{rel_folder}/{f}' for f in pdf_files]
                catalog[f'{rel_folder}__items'] = classified_items

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
