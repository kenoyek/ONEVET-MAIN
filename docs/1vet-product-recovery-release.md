# Product stock checks and recovery — 18 November 2026

Product detail pages now offer Refresh price and stock and recheck the published listing every 30 seconds. Adding to the cart is paused while the product query is fetching. After a successful check, the page explains that stock and price reflect that check and items are not reserved. Out-of-stock products retain their details with a route to browse other products.

Removed or unpublished listings now use a complete branded recovery page with shop, cart and check-again actions. Loading also retains navigation. The back-to-shop and alternative-product paths preserve the visitor’s existing shop filters. Existing failed-query recovery remains available and does not expose stale add-to-cart actions.

The shared product action accepts an optional checking flag, leaving existing listing-card behavior unchanged. Product checks use the public catalogue service; no private seller lookup, order, payment, stock reservation or backend mutation is introduced. Online checkout remains unavailable.

All 546 tests across 128 files pass. Type checking and production build pass; lint has zero errors and nine existing warnings. Validation covers missing listings, stock checks that disable additions, stock dropping to zero, a listing removed during refresh, lookup failure and recovery, and retained shop filters. Local Chromium verifies stock-check blocking, zero-stock guidance, removed-listing recovery, cart access, check-again recovery and filter retention at widths 1440, 390 and 320 without runtime exceptions. Browser scenarios use intercepted synthetic catalogue responses rather than live purchases. No migration, backend deployment, cloud environment publication or live Supabase account inspection is included.
