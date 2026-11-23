# Northstar Goods — Checkout Demo

A single-page, client-side checkout built with plain HTML, CSS and JavaScript. It uses two synthetic products and fixed INR prices. There is no backend, database, payment processing or external service dependency. Google Fonts are an optional visual enhancement; system fonts remain as fallbacks.

## Requirements

- Python 3.9+ (for the local static server and test runner)
- Chromium
- Python packages: `pytest` and `playwright`

## Run the checkout

From this directory:

```bash
python3 -m http.server 4173
```

Open <http://127.0.0.1:4173> in Chromium or another modern browser. Add either product, adjust quantities with +/−, remove a line, enter a name and place the order. Prices are fixed: Studio Ceramic Mug ₹499.00 and Everyday Canvas Tote ₹799.00.

## Install and run browser tests

```bash
python3 -m pip install pytest playwright
python3 -m playwright install chromium
```

If Chromium is installed at `/usr/bin/chromium`, run:

```bash
pytest -q
```

The tests use Playwright's locator assertions. The execution environment used for this run blocked browser navigation to local URLs, so the test helper inlines the actual `index.html`, `styles.css` and `app.js` into a fresh browser document with `page.set_content()`. Each test creates a new browser page and starts with clean in-memory cart and form state. They verify:

1. A valid checkout shows a confirmation, customer name and reference.
2. A blank required name blocks checkout, displays validation and preserves the cart.
3. Increasing a mug quantity to two updates the line total and order total to exactly ₹998.00.

If your Chromium executable is elsewhere, change the `executable_path` in `tests/test_checkout.py` to your local browser path, or remove that argument to let Playwright use its managed browser.

## Test plan and results

See [TEST_PLAN.md](TEST_PLAN.md) for risk priorities, the three automated checks, manual empty-cart and rapid-double-click exercises, and observed results. Browser screenshots from the executed checks are stored in `evidence/`.

## Implementation notes

- Cart state is held in a JavaScript `Map`; the total is recalculated from fixed product prices and integer quantities.
- A blank name and an empty cart are rejected before confirmation. The form does not reset, so entered values remain available after validation.
- The order guard is set synchronously before confirmation is rendered. The submit button and cart controls are disabled after success to prevent repeat orders.
- The order reference is generated locally for demonstration only; it is not a server-issued order ID.
