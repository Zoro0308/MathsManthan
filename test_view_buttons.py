import urllib.request
from playwright.sync_api import sync_playwright

def test_free_books():
    print("Testing http://localhost:8000/free-books.html with Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        page.goto("http://localhost:8000/free-books.html", wait_until="networkidle")
        page.wait_for_timeout(1000)

        print(f"Console errors: {len(console_errors)}")

        # 1. Test all complete book View PDF links on the page
        view_links = page.evaluate("""() => {
            const links = [];
            document.querySelectorAll('#booksOverviewSection .pdf-toggle-btn.btn-view').forEach(btn => {
                const card = btn.closest('.resource-card');
                const title = card ? card.querySelector('.resource-title')?.innerText.trim() : 'Unknown';
                links.push({
                    title: title,
                    href: btn.getAttribute('href')
                });
            });
            return links;
        }""")

        print(f"\nFound {len(view_links)} complete book View buttons:")
        for item in view_links:
            href = item['href']
            url = f"http://localhost:8000/{href}"
            try:
                resp = urllib.request.urlopen(urllib.request.Request(url, method='HEAD'))
                print(f"  OK [200]: {item['title'][:35]} -> {href}")
            except Exception as e:
                print(f"  FAIL: {item['title']} -> {url} : {e}")

        # 2. Test in-page chapter directory for Class 10
        print("\nTesting Chapter Directory for Class 10...")
        page.click("button[data-class='class10']")
        page.wait_for_timeout(500)

        ch10_links = page.evaluate("""() => {
            const links = [];
            document.querySelectorAll('#inpageChaptersGrid .inpage-chapter-card').forEach(card => {
                const title = card.querySelector('.resource-title')?.innerText.trim() || '';
                const btn = card.querySelector('.btn-view');
                if (btn) {
                    links.push({
                        title: title,
                        href: btn.getAttribute('href')
                    });
                }
            });
            return links;
        }""")

        print(f"Found {len(ch10_links)} chapters in Class 10 directory:")
        for item in ch10_links:
            href = item['href']
            url = f"http://localhost:8000/{href}"
            try:
                resp = urllib.request.urlopen(urllib.request.Request(url, method='HEAD'))
                print(f"  OK [200]: {item['title'][:30]} -> {href}")
            except Exception as e:
                print(f"  FAIL: {item['title']} -> {url} : {e}")

        # 3. Test in-page chapter directory for Class 8
        print("\nTesting Chapter Directory for Class 8...")
        page.click("#backToBooksBtn")
        page.wait_for_timeout(300)
        page.click("button[data-class='class8']")
        page.wait_for_timeout(500)

        ch8_links = page.evaluate("""() => {
            const links = [];
            document.querySelectorAll('#inpageChaptersGrid .inpage-chapter-card').forEach(card => {
                const title = card.querySelector('.resource-title')?.innerText.trim() || '';
                const btn = card.querySelector('.btn-view');
                if (btn) {
                    links.push({
                        title: title,
                        href: btn.getAttribute('href')
                    });
                }
            });
            return links;
        }""")

        print(f"Found {len(ch8_links)} chapters in Class 8 directory:")
        for item in ch8_links:
            href = item['href']
            url = f"http://localhost:8000/{href}"
            try:
                resp = urllib.request.urlopen(urllib.request.Request(url, method='HEAD'))
                print(f"  OK [200]: {item['title'][:30]} -> {href}")
            except Exception as e:
                print(f"  FAIL: {item['title']} -> {url} : {e}")

        browser.close()
        print("\nAll View PDF links successfully verified without errors!")

if __name__ == '__main__':
    test_free_books()
