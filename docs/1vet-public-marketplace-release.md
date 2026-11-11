# Public marketplace discovery — 11 November 2026

Visitors previously could not discover the shop in homepage navigation, and product/cart routes forced sign-in. The homepage now includes a dedicated marketplace section, with links in desktop navigation, the mobile menu and footer. A persistent mobile Shop tab replaces Pricing; Pricing remains in More and the navigation menu.

Marketplace, product detail and cart routes are public. Reads still use the eligibility-filtered `shop_catalogue` view; admin routes and checkout retain their existing protection. No backend access rules were widened and no products were inserted.

Visitors can create a browser-local cart and reach signup from the marketplace or cart. Auth links preserve a return path to the cart. Signing in merges the guest cart into the account cart, combines overlapping items within the stock/quantity limit, persists the result, and consumes guest storage only after persistence succeeds. Subsequent account switches and logout retain separate account carts. Current prices and stock are rechecked on the cart page. Old unscoped cart data is not imported.

Online purchases remain unavailable under the existing instruction to leave payments disabled. Homepage and cart copy state that checkout is paused; creating an account does not complete a purchase.

Validation: 333 tests in 87 files passed, including guest-to-account handoff and stock-capped merges. Typecheck and production build passed; lint has zero errors and nine existing warnings. Chromium checked anonymous homepage discovery, catalogue/product access, guest cart, signup mode and account-cart handoff, at widths 1440/390/320 without overflow or runtime exceptions. Browser responses were synthetic fixtures; no production purchases or accounts were created. Screenshots are retained in `/workspace/artifacts/1vet/public-shop` for this session.

Deploy the new main frontend commit to expose the changes. No database migration or environment publication was needed. Production hostname deployment was not browser-verified.
