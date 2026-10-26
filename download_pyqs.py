import os
import urllib.request
import time

basic_urls = [
    ("Maths_Class_10_2020_Basic_Set_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-1.pdf"),
    ("Maths_Class_10_2020_Basic_Set_1_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-1-2.pdf"),
    ("Maths_Class_10_2020_Basic_Set_1_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-1-3.pdf"),
    ("Maths_Class_10_2020_Basic_Set_2_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-2-1.pdf"),
    ("Maths_Class_10_2020_Basic_Set_2_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-2-2.pdf"),
    ("Maths_Class_10_2020_Basic_Set_2_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-2-3.pdf"),
    ("Maths_Class_10_2020_Basic_Set_3_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-3-1.pdf"),
    ("Maths_Class_10_2020_Basic_Set_3_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-3-2.pdf"),
    ("Maths_Class_10_2020_Basic_Set_3_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-3-3.pdf"),
    ("Maths_Class_10_2020_Basic_Set_4_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-4-1.pdf"),
    ("Maths_Class_10_2020_Basic_Set_4_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-4-2.pdf"),
    ("Maths_Class_10_2020_Basic_Set_4_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-4-3.pdf"),
    ("Maths_Class_10_2020_Basic_Set_5_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-5-1.pdf"),
    ("Maths_Class_10_2020_Basic_Set_5_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-5-2.pdf"),
    ("Maths_Class_10_2020_Basic_Set_5_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-5-3.pdf"),
]

standard_urls = [
    ("Maths_Class_10_2020_Standard_Set_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-1-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_1_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-1-2-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_1_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-1-3-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_2_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-2-1-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_2_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-2-2-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_2_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-2-3-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_3_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-3-1-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_3_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-3-2-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_3_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-3-3-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_4_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-4-1-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_4_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-4-2-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_4_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-4-3-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_5_1.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-5-1-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_5_2.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-5-2-1.pdf"),
    ("Maths_Class_10_2020_Standard_Set_5_3.pdf", "https://www.evidyarthi.in/wp-content/uploads/2022/10/cbse-class-10-maths-previous-year-paper-2020-set-5-3-1.pdf"),
]

base_dest = os.path.join(os.getcwd(), "CBSE_Class_10_Maths_PYQ_2020")
basic_dest = os.path.join(base_dest, "Basic")
standard_dest = os.path.join(base_dest, "Standard")

os.makedirs(basic_dest, exist_ok=True)
os.makedirs(standard_dest, exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def download_list(items, folder, category):
    print(f"Downloading {len(items)} {category} papers...")
    for idx, (filename, url) in enumerate(items, 1):
        target_path = os.path.join(folder, filename)
        if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
            print(f"[{idx}/{len(items)}] Already exists: {filename}")
            continue
        print(f"[{idx}/{len(items)}] Downloading {filename} from {url}...")
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp, open(target_path, 'wb') as f:
                f.write(resp.read())
            print(f"       -> Saved ({os.path.getsize(target_path):,} bytes)")
        except Exception as e:
            print(f"       -> ERROR downloading {url}: {e}")
        time.sleep(0.5)

download_list(basic_urls, basic_dest, "Basic")
download_list(standard_urls, standard_dest, "Standard")
print("Download finished!")
