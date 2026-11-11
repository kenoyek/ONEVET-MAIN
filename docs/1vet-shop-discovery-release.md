# Marketplace discovery — 11 November 2026

The public marketplace now supports newest, price ascending/descending and alphabetical sorting, an in-stock-only filter, visible result counts and a filter reset. Search matches all words across product names and descriptions, ignoring case and extra whitespace. Invalid URL categories/sorts fall back to defaults; searches are bounded to 200 characters.

Search, category, availability and sorting are represented in URL parameters. Product links preserve those parameters and Back to Store restores the filtered view. Reloading or sharing a filtered URL retains the choices. Counts describe products shown from the loaded catalogue, not an unbounded database total. Server-side catalogue eligibility and category filtering remain in place.

Gallery buttons now expose accessible names and selected states; navigating between product IDs resets the selected image.

Validation: 337 tests in 88 files passed. Typecheck and production build passed; lint has zero errors and nine existing warnings. Chromium checked numeric sorting, stock filtering, URL reload persistence, product/back navigation and reset at widths 1440/390/320 without overflow or runtime exceptions. Browser tests used synthetic intercepted products and did not insert production stock. Session artifacts are in `/workspace/artifacts/1vet/shop-discovery`.

No database migration or environment publication is needed. Deploy the new main frontend commit to expose the changes; the production hostname was not browser-verified. Browsing remains public and online checkout remains unavailable.
