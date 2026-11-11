# Cart updates and recovery — 11 November 2026

The cart now explains price changes, stock-driven quantity reductions, unavailable products and restored availability. Notices accumulate up to twenty unique recent messages for the current mounted cart and can be dismissed. Existing cart refresh rules still determine quantity and subtotal updates; notices do not reserve inventory or create orders.

Current prices and stock refresh every thirty seconds while the cart is active and through an explicit refresh button. Failed checks retain the cart and label the summary as Last known subtotal. Unavailable items can be removed together; their quantity controls are disabled. Unit prices and totals use consistent NGN decimal formatting, and failed cart images use the shared product fallback. Guest account-creation links and account cart isolation are preserved.

Validation: 343 tests in 90 files passed, including price/stock change explanations, restored availability and invalid catalogue values. Typecheck and production build passed; lint has zero errors and nine existing warnings. Chromium verified price notices, quantity reductions, bulk removal, manual refresh, notice dismissal, failed-check retention and retry at widths 1440/390/320 without overflow or runtime exceptions. Browser checks used synthetic intercepted catalogue responses and did not create production products or purchases. Session screenshots are under `/workspace/artifacts/1vet/cart-updates`.

Deploy the new main frontend commit to expose these changes. No database migration or environment publication is needed. Production hosting was not browser-verified. Checkout and payments remain unavailable.
