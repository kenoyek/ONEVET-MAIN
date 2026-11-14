# Shopping cart persistence feedback — 14 November 2026

Cart and checkout availability pages now show a notice when browser storage fails. Current in-memory items stay available, and Retry saving cart attempts to persist the current cart again. The notice clears only after a successful write. Guest items are consumed into an account cart only after the account write succeeds, preserving existing handoff behavior.

The cart no longer claims current changes are saved when the write failed. Account prompts clarify that carts remain local to this browser and do not sync across devices. Storage failure notices explain reload/navigation risks only when an actual save failure occurs. Checkout and payments remain unavailable; no order/payment or server-side cart synchronization was added.

Validation includes failed writes retaining items, successful retry persistence and the existing account-isolation/cart-handoff suite, plus application/API typechecks, lint and production build. Local Chromium simulates quota failures for cart keys only, checks failure/retry states and responsive widths 1440, 390 and 320, and uses synthetic intercepted catalogue responses without production writes. These checks do not establish live deployment.
