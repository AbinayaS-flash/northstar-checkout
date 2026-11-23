
from pathlib import Path
import re

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]


def load_app(page):
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    js = (ROOT / "app.js").read_text(encoding="utf-8")

    css = css.replace(
        "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap');",
        ""
    )

    html = html.replace(
        '<link rel="stylesheet" href="styles.css" />',
        f"<style>{css}</style>"
    )

    html = html.replace(
        '<script src="app.js" defer></script>',
        ""
    )

    html = html.replace(
        "</body>",
        f"<script>{js}</script></body>"
    )

    page.set_content(
        html,
        wait_until="domcontentloaded",
        timeout=10000
    )


def test_successful_checkout_shows_single_confirmation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            load_app(page)

            page.get_by_role("button", name="Add").first.click()
            page.get_by_label("Your name").fill("Avery Customer")
            page.get_by_role("button", name="Place order").click()

            expect(
                page.get_by_role("heading", name="You're all set.")
            ).to_be_visible()

            expect(
                page.locator("#confirmation-copy")
            ).to_contain_text("Avery Customer")

            expect(
                page.locator("#order-reference")
            ).to_have_text(
                re.compile(r"^NS-[A-Z0-9]+-[A-Z0-9]{4}$")
            )

            expect(
                page.locator("#confirmation")
            ).to_have_attribute("data-confirmation-count", "1")

        finally:
            browser.close()


def test_missing_name_blocks_checkout_and_preserves_cart():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            load_app(page)

            page.get_by_role("button", name="Add").nth(1).click()
            page.get_by_role("button", name="Place order").click()

            expect(
                page.get_by_role("alert")
            ).to_contain_text("Please enter your name")

            expect(
                page.locator("#cart-lines").get_by_text(
                    "Everyday Canvas Tote"
                )
            ).to_be_visible()

            expect(
                page.locator("#order-total")
            ).to_have_text("₹ 799.00")

            expect(
                page.locator("#confirmation")
            ).to_be_hidden()

            expect(
                page.get_by_label("Your name")
            ).to_have_value("")

        finally:
            browser.close()


def test_quantity_change_updates_exact_line_and_order_totals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            load_app(page)

            page.get_by_role("button", name="Add").first.click()

            page.get_by_role(
                "button",
                name="Increase Studio Ceramic Mug quantity"
            ).click()

            expect(
                page.locator(".line-total")
            ).to_have_text("₹ 998.00")

            expect(
                page.locator("#subtotal")
            ).to_have_text("₹ 998.00")

            expect(
                page.locator("#order-total")
            ).to_have_text("₹ 998.00")

            expect(
                page.locator(".quantity-controls output")
            ).to_have_text("2")

        finally:
            browser.close()
