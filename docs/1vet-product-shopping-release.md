# Product-to-cart experience — 11 November 2026

Marketplace cards and product pages now share stock-aware cart controls. They show the existing cart quantity, offer Add another when appropriate, and disable additions when loaded stock or the cart quantity limit is reached. Missing/zero stock blocks additions. The existing cart provider remains the final client-side quantity guard, and current prices/stock are rechecked in the cart. This does not reserve inventory.

Product pages provide a direct View cart action and clarify that saved items are not reservations. Description line breaks are preserved, and delivery/stock panels stack on narrow screens. Product galleries and marketplace images now render the existing category-aware fallback when an image fails to load. Gallery thumbnail selection remains accessible.

Validation: 340 tests in 89 files passed. Typecheck and production build passed; lint has zero errors and nine existing warnings. New tests cover stock-limited controls, missing/reduced stock and image failure/recovery. Chromium checked visitor cart quantities across cards and product pages, disabled stock-limit controls, gallery selection, intentionally broken image sources and the cart link at widths 1440/390/320, without overflow or runtime exceptions. Browser responses were intercepted fixtures; no production inventory or purchases were created. Session artifacts are under `/workspace/artifacts/1vet/product-shopping`.

Deploy the new main frontend commit to expose the changes. No database migration or environment publication is needed; production hosting was not browser-verified. Online checkout remains unavailable.
