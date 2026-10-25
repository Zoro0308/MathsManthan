import os
import sys
from playwright.sync_api import sync_playwright

def run_tests():
    output_dir = os.path.join(os.path.dirname(__file__), "screenshots_test")
    os.makedirs(output_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print("1. Loading http://localhost:8000/index.html ...")
        page.goto("http://localhost:8000/index.html", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Check console errors
        print(f"Console errors detected: {len(console_errors)}")
        for err in console_errors:
            print("  ERR:", err)

        # 2. Check Canvas computed style in hybrid mode
        canvas_info = page.evaluate("""() => {
            const canvas = document.getElementById('matrix-canvas');
            const style = window.getComputedStyle(canvas);
            const rect = canvas.getBoundingClientRect();
            return {
                position: style.position,
                zIndex: style.zIndex,
                width: rect.width,
                height: rect.height,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                bodyFlow: document.body.getAttribute('data-bg-flow')
            };
        }""")
        print("Canvas Computed Info (Hybrid Mode):", canvas_info)
        assert canvas_info["position"] == "fixed", f"Expected position fixed, got {canvas_info['position']}"
        assert canvas_info["bodyFlow"] == "hybrid"

        # Capture Hero Screenshot (Dark Mode)
        hero_shot = os.path.join(output_dir, "01_hero_dark.png")
        page.screenshot(path=hero_shot)
        print(f"Saved: {hero_shot}")

        # 3. Scroll Down to Batches Section & Check
        print("3. Scrolling to Batches Section...")
        page.evaluate("window.scrollTo({ top: 950, behavior: 'instant' });")
        page.wait_for_timeout(500)

        batches_info = page.evaluate("""() => {
            const canvas = document.getElementById('matrix-canvas');
            const rect = canvas.getBoundingClientRect();
            const batches = document.querySelector('.batches-section');
            const batchesRect = batches.getBoundingClientRect();
            const card = document.querySelector('.batch-card');
            const cardStyle = window.getComputedStyle(card);
            return {
                canvasTop: rect.top,
                canvasPosition: window.getComputedStyle(canvas).position,
                batchesVisible: batchesRect.top < window.innerHeight && batchesRect.bottom > 0,
                cardBg: cardStyle.backgroundColor,
                cardBackdrop: cardStyle.backdropFilter
            };
        }""")
        print("Batches Scroll Info:", batches_info)
        assert batches_info["canvasTop"] == 0, "Canvas should remain fixed at top: 0"
        assert batches_info["canvasPosition"] == "fixed"

        batches_shot = os.path.join(output_dir, "02_batches_scrolled_dark.png")
        page.screenshot(path=batches_shot)
        print(f"Saved: {batches_shot}")

        # 4. Scroll Down to Methodology & Inquiry Section
        print("4. Scrolling to Methodology and Inquiry Section...")
        page.evaluate("window.scrollTo({ top: 1800, behavior: 'instant' });")
        page.wait_for_timeout(500)

        methodology_shot = os.path.join(output_dir, "03_methodology_scrolled_dark.png")
        page.screenshot(path=methodology_shot)
        print(f"Saved: {methodology_shot}")

        # 5. Test Light Mode Toggle
        print("5. Testing Theme Toggle to Light Mode...")
        page.click("#themeToggleBtn")
        page.wait_for_timeout(500)

        theme_info = page.evaluate("""() => {
            return {
                theme: document.documentElement.getAttribute('data-theme'),
                bodyFlow: document.body.getAttribute('data-bg-flow'),
                canvasPos: window.getComputedStyle(document.getElementById('matrix-canvas')).position
            };
        }""")
        print("Theme Info (Light Mode):", theme_info)
        assert theme_info["theme"] == "light"

        light_shot = os.path.join(output_dir, "04_batches_scrolled_light.png")
        page.screenshot(path=light_shot)
        print(f"Saved: {light_shot}")

        # 6. Test Reversibility (setting data-bg-flow="hero-only")
        print("6. Testing Instant Reversibility (Switching to hero-only)...")
        revert_info = page.evaluate("""() => {
            document.body.setAttribute('data-bg-flow', 'hero-only');
            const canvas = document.getElementById('matrix-canvas');
            const style = window.getComputedStyle(canvas);
            return {
                position: style.position,
                zIndex: style.zIndex
            };
        }""")
        print("Revert Info (data-bg-flow='hero-only'):", revert_info)
        assert revert_info["position"] == "absolute", f"Expected position absolute, got {revert_info['position']}"

        # Switch back to hybrid
        page.evaluate("document.body.setAttribute('data-bg-flow', 'hybrid');")

        browser.close()
        print("\nAll Playwright DOM & CSS tests passed successfully!")

if __name__ == "__main__":
    run_tests()
