"""
Maths Manthan - Dynamic PDF Sync Engine
Automatically scans all chapter and book folders, detects whatever PDF files are placed inside (regardless of filename),
and updates assets/data/pdf-catalog.json and assets/data/chapters-data.json.
Can run once or run with --watch to monitor in real-time.
"""

import os
import sys
import time
import json
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDFS_DIR = os.path.join(BASE_DIR, 'assets', 'pdfs')
DATA_DIR = os.path.join(BASE_DIR, 'assets', 'data')
CATALOG_PATH = os.path.join(DATA_DIR, 'pdf-catalog.json')
CHAPTERS_PATH = os.path.join(DATA_DIR, 'chapters-data.json')

def make_starter_pdf(filepath, title, subtitle='MATHS MANTHAN | TUITION CLASSES'):
    if os.path.exists(filepath):
        return
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        c = canvas.Canvas(filepath, pagesize=letter)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(50, 750, title[:65])
        c.setFont("Helvetica", 12)
        c.drawString(50, 720, subtitle)
        c.drawString(50, 700, "Mentor: Manthan Ahlawat | D121 European Estate, Kankerkhera, Meerut")
        c.drawString(50, 680, "Official NCERT Study Material & Practice Assignment")
        c.save()
    except Exception as e:
        print(f"Could not generate starter PDF: {e}")

def init_folders():
    # 1. Classroom Hub folders:
    hub_specs = {
        'class-8': [f'ch-{i:02d}' for i in range(1, 15)] + ['formula'],
        'class-9': [f'ch-{i:02d}' for i in range(1, 15)] + ['formula'],
        'class-10': [f'ch-{i:02d}' for i in range(1, 15)] + ['formula', 'pyq', 'mock'],
        'class-11': [f'ch-{i:02d}' for i in range(1, 15)] + ['formula'],
        'class-12': [f'ch-{i:02d}' for i in range(1, 14)] + ['formula', 'pyq', 'mock'],
    }

    for cls, folders in hub_specs.items():
        for f in folders:
            folder_path = os.path.join(PDFS_DIR, cls, f)
            os.makedirs(folder_path, exist_ok=True)
            existing_pdfs = [p for p in os.listdir(folder_path) if p.lower().endswith('.pdf')]
            if not existing_pdfs:
                default_file = os.path.join(folder_path, f'{cls}-{f}.pdf')
                make_starter_pdf(default_file, f'{cls.upper()} - {f.upper()} Study Material')

    # 2. Books Complete folders:
    complete_book_folders = [
        'class-8-ganita-prakash', 'class-9-ganita-manjari', 
        'class-10-mathematics', 'class-10-science',
        'class-11-mathematics', 
        'class-12-maths-part1', 'class-12-maths-part2',
        'exemplar-class-10', 'exemplar-class-11', 'exemplar-class-12',
        'lab-manual-class-10', 'lab-manual-class-12'
    ]
    for bf in complete_book_folders:
        bp = os.path.join(PDFS_DIR, 'books', 'complete', bf)
        os.makedirs(bp, exist_ok=True)
        existing_pdfs = [p for p in os.listdir(bp) if p.lower().endswith('.pdf')]
        if not existing_pdfs:
            default_file = os.path.join(bp, f'{bf}-complete.pdf')
            readable_name = bf.replace('-', ' ').title()
            make_starter_pdf(default_file, f'NCERT {readable_name} Complete Book')

    # 3. Books Chapter-wise folders:
    chapter_book_specs = {
        'class-8': [f'ch-{i:02d}' for i in range(1, 15)],
        'class-9': [f'ch-{i:02d}' for i in range(1, 15)],
        'class-10': [f'ch-{i:02d}' for i in range(1, 15)],
        'class-11': [f'ch-{i:02d}' for i in range(1, 15)],
        'class-12': [f'ch-{i:02d}' for i in range(1, 14)],
    }
    for cls, folders in chapter_book_specs.items():
        for f in folders:
            folder_path = os.path.join(PDFS_DIR, 'books', 'chapter-wise', cls, f)
            os.makedirs(folder_path, exist_ok=True)
            existing_pdfs = [p for p in os.listdir(folder_path) if p.lower().endswith('.pdf')]
            if not existing_pdfs:
                default_file = os.path.join(folder_path, f'ncert-{cls}-{f}.pdf')
                make_starter_pdf(default_file, f'NCERT {cls.upper()} {f.upper()} Textbook Chapter')

def sync():
    """
    Scans PDF directory, updates pdf-catalog.json, chapters-data.json, and returns whether changes were made.
    """
    catalog = {}
    for root, dirs, files in os.walk(PDFS_DIR):
        rel_folder = os.path.relpath(root, PDFS_DIR).replace('\\', '/')
        if rel_folder == '.':
            continue
        pdf_files = [f for f in files if f.lower().endswith('.pdf')]
        if pdf_files:
            # Prioritize real user-uploaded files over starter templates if both exist
            user_files = [f for f in pdf_files if not f.startswith('ncert-') and not f.startswith('class-') and not f.startswith('mm-')]
            if user_files:
                # Pick largest or latest user file
                user_files.sort(key=lambda x: os.path.getsize(os.path.join(root, x)), reverse=True)
                primary_pdf = user_files[0]
            else:
                primary_pdf = sorted(pdf_files)[0]
            
            rel_path = f'assets/pdfs/{rel_folder}/{primary_pdf}'
            catalog[rel_folder] = rel_path
            catalog[f'{rel_folder}__all'] = [f'assets/pdfs/{rel_folder}/{f}' for f in pdf_files]

    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Check if catalog changed
    prev_catalog = {}
    if os.path.exists(CATALOG_PATH):
        try:
            with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
                prev_catalog = json.load(f)
        except Exception:
            pass

    catalog_changed = (catalog != prev_catalog)
    if catalog_changed:
        with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2)
        print(f"[SYNC] Updated {CATALOG_PATH} with {len(catalog)} entries.")

    # Update chapters-data.json
    if os.path.exists(CHAPTERS_PATH):
        try:
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
                print(f"[SYNC] Updated {CHAPTERS_PATH} with latest resolved PDF paths.")
        except Exception as e:
            print(f"[SYNC ERROR] Failed updating chapters-data.json: {e}")

    # Update hardcoded hrefs in books-class-10.html, etc. if needed
    update_html_hrefs(catalog)
    return catalog_changed

def update_html_hrefs(catalog):
    for fn in ['books-class-8.html', 'books-class-9.html', 'books-class-10.html', 'books-class-11.html', 'books-class-12.html']:
        fp = os.path.join(BASE_DIR, fn)
        if not os.path.exists(fp):
            continue
        try:
            with open(fp, 'r', encoding='utf-8') as f:
                html = f.read()

            changed = False
            for folder_key, pdf_url in catalog.items():
                if folder_key.endswith('__all'):
                    continue
                # Match href="..." on cards with data-folder="folder_key"
                # Or replace old ncert-class-X-ch-YY with new pdf_url
                pattern = rf'href=["\'](assets/pdfs/{re.escape(folder_key)}/[^"\']+\.pdf)["\']'
                def repl(m):
                    nonlocal changed
                    if m.group(1) != pdf_url:
                        changed = True
                        return f'href="{pdf_url}"'
                    return m.group(0)
                html = re.sub(pattern, repl, html)

            if changed:
                with open(fp, 'w', encoding='utf-8') as f:
                    f.write(html)
                print(f"[SYNC] Updated HTML hrefs in {fn}")
        except Exception as e:
            print(f"[SYNC ERROR] Error updating {fn}: {e}")

def watch_loop():
    print("[SYNC WATCHER] Monitoring assets/pdfs/ for real-time PDF additions and changes...")
    while True:
        try:
            sync()
            time.sleep(2)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"[SYNC WATCHER ERROR]: {e}")
            time.sleep(3)

if __name__ == '__main__':
    init_folders()
    sync()
    if '--watch' in sys.argv:
        watch_loop()
