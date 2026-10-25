import os
import shutil
import json
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDFS_DIR = os.path.join(BASE_DIR, "assets", "pdfs")
DATA_DIR = os.path.join(BASE_DIR, "assets", "data")
CATALOG_PATH = os.path.join(DATA_DIR, "pdf-catalog.json")
CHAPTERS_PATH = os.path.join(DATA_DIR, "chapters-data.json")

print("1. Creating aliases for complete book folders...")

# Complete folders mapping
complete_aliases = {
    "class-8-ganita-prakash": ["class-8-ganita-prakash-complete.pdf", "books-class8-ganita-prakash.pdf"],
    "class-9-ganita-manjari": ["class-9-ganita-manjari-complete.pdf", "books-class9-ganita-manjari.pdf"],
    "class-10-mathematics": ["class-10-mathematics-complete.pdf", "books-class10-ncert-mathematics.pdf"],
    "class-10-science": ["class-10-science-complete.pdf", "books-class10-ncert-science.pdf"],
    "class-11-mathematics": ["class-11-mathematics-complete.pdf", "books-class11-ncert-mathematics.pdf"],
    "class-12-maths-part1": ["class-12-maths-part1-complete.pdf", "books-class12-ncert-maths-part1.pdf"],
    "class-12-maths-part2": ["class-12-maths-part2-complete.pdf", "books-class12-ncert-maths-part2.pdf"],
    "exemplar-class-10": ["exemplar-class-10-complete.pdf", "exemplar-class-10.pdf", "books-class10-ncert-exemplar-maths.pdf"],
    "exemplar-class-11": ["exemplar-class-11-complete.pdf", "exemplar-class-11.pdf", "books-class11-ncert-exemplar-maths.pdf"],
    "exemplar-class-12": ["exemplar-class-12-complete.pdf", "exemplar-class-12.pdf", "books-class12-ncert-exemplar-maths.pdf"],
    "lab-manual-class-10": ["lab-manual-class-10-complete.pdf", "books-class10-maths-lab-manual.pdf"],
    "lab-manual-class-12": ["lab-manual-class-12-complete.pdf", "books-class12-maths-lab-manual.pdf"],
}

for folder_name, alias_names in complete_aliases.items():
    folder_path = os.path.join(PDFS_DIR, "books", "complete", folder_name)
    if not os.path.exists(folder_path):
        continue
    existing_pdfs = [f for f in os.listdir(folder_path) if f.lower().endswith(".pdf")]
    if not existing_pdfs:
        continue
    # Find primary file (largest or complete)
    complete_candidates = [f for f in existing_pdfs if "complete" in f.lower()]
    if complete_candidates:
        primary = complete_candidates[0]
    else:
        existing_pdfs.sort(key=lambda x: os.path.getsize(os.path.join(folder_path, x)), reverse=True)
        primary = existing_pdfs[0]
    
    src = os.path.join(folder_path, primary)
    for alias in alias_names:
        dst = os.path.join(folder_path, alias)
        if not os.path.exists(dst):
            shutil.copy2(src, dst)
            print(f"  [COMPLETE ALIAS] {folder_name}: copied {primary} -> {alias}")

print("\n2. Creating aliases for chapter-wise folders...")
chap_wise_dir = os.path.join(PDFS_DIR, "books", "chapter-wise")

for cls_dir in sorted(os.listdir(chap_wise_dir)):
    cls_path = os.path.join(chap_wise_dir, cls_dir)
    if not os.path.isdir(cls_path):
        continue
    cls_num = cls_dir.replace("class-", "")
    for ch_dir in sorted(os.listdir(cls_path)):
        ch_path = os.path.join(cls_path, ch_dir)
        if not os.path.isdir(ch_path):
            continue
        pdfs = [f for f in os.listdir(ch_path) if f.lower().endswith(".pdf")]
        if not pdfs:
            continue
        # Find real user-provided file (largest file)
        pdfs.sort(key=lambda x: os.path.getsize(os.path.join(ch_path, x)), reverse=True)
        primary = pdfs[0]
        src = os.path.join(ch_path, primary)

        # Standard alias
        std_alias = f"ncert-class-{cls_num}-{ch_dir}.pdf"
        dst = os.path.join(ch_path, std_alias)
        if not os.path.exists(dst):
            shutil.copy2(src, dst)
            print(f"  [CHAPTER ALIAS] {cls_dir}/{ch_dir}: {primary} -> {std_alias}")

print("\n3. Building fresh pdf-catalog.json...")
catalog = {}
for root, dirs, files in os.walk(PDFS_DIR):
    rel_folder = os.path.relpath(root, PDFS_DIR).replace("\\", "/")
    if rel_folder == ".":
        continue
    pdfs = [f for f in files if f.lower().endswith(".pdf")]
    if not pdfs:
        continue
    
    # Selection logic for primary file
    complete_cand = [f for f in pdfs if "complete" in f.lower()]
    if complete_cand:
        primary = complete_cand[0]
    else:
        # User files first (not starting with ncert- or books-)
        user_cand = [f for f in pdfs if not f.startswith("ncert-") and not f.startswith("books-") and not f.startswith("class-")]
        if user_cand:
            user_cand.sort(key=lambda x: os.path.getsize(os.path.join(root, x)), reverse=True)
            primary = user_cand[0]
        else:
            pdfs.sort(key=lambda x: os.path.getsize(os.path.join(root, x)), reverse=True)
            primary = pdfs[0]

    rel_path = f"assets/pdfs/{rel_folder}/{primary}"
    catalog[rel_folder] = rel_path
    catalog[f"{rel_folder}__all"] = [f"assets/pdfs/{rel_folder}/{f}" for f in pdfs]

with open(CATALOG_PATH, "w", encoding="utf-8") as f:
    json.dump(catalog, f, indent=2)
print(f"  -> Generated {CATALOG_PATH} with {len(catalog)} entries.")

print("\n4. Syncing chapters-data.json with real paths...")
if os.path.exists(CHAPTERS_PATH):
    with open(CHAPTERS_PATH, "r", encoding="utf-8") as f:
        ch_data = json.load(f)
    for class_key, book_info in ch_data.items():
        folder_prefix = book_info.get("folderPrefix", "")
        for ch in book_info.get("chapters", []):
            ch_id = ch.get("ch", "")
            folder_key = f"{folder_prefix}/{ch_id}"
            if folder_key in catalog:
                ch["pdf"] = catalog[folder_key]
    with open(CHAPTERS_PATH, "w", encoding="utf-8") as f:
        json.dump(ch_data, f, indent=2)
    print(f"  -> Updated {CHAPTERS_PATH}.")

print("\nSync and alias complete!")
