# Admin shop catalogue — 11 November 2026

Administrators can open **Admin → Manage shop catalogue** (`/admin/shop`) to add real products, update NGN prices and whole-unit stock, supply up to five HTTPS image URLs, and choose draft, published or hidden visibility. The editor retains input after failed saves and prevents duplicate pending submissions. Sellers cannot be reassigned on an existing product.

Only an active account with an approved business organization, or a verified legacy service-provider account, can be selected as a seller. Main currently has **one eligible seller and zero public products**; no demonstration stock was inserted. Products must be supplied by the actual business. Checkout and payments remain unavailable.

## Database controls

The old seller `FOR ALL` listing policy allowed self-approval. Direct client mutation privileges are now revoked; saves go through `admin_save_shop_product`, which requires an active administrator and writes an audit record. Trusted service-role stock updates remain available. Monotonic row timestamps and expected-revision checks prevent stale edits from overwriting stock; stable creation UUIDs make identical create retries idempotent.

Public shop, product and cart reads use `shop_catalogue`, which exposes the seller display name without querying private seller profiles. Only approved, active listings from eligible sellers appear, including when an owner qualifies through an approved organization rather than legacy profile verification. Suspension removes products from public reads. Administrators can still hide existing records, preserving order references.

The migration `20261111010000_admin_shop_catalogue.sql` was applied and tracked on the main `onevet-production` Supabase project. Previously tracked migrations were skipped. The reviewed customer schema extension supplies the new view and RPC types.

## Verification

- 321 frontend tests in 85 files passed; typecheck and production build passed. Lint has zero errors and nine existing Fast Refresh warnings.
- Isolated PostgreSQL suite: 412 SQL assertions and five concurrency checks passed. The catalogue suite is included in the existing CI security runner.
- Twenty catalogue assertions also passed against main in a fully rolled-back transaction; synthetic users were confirmed absent afterward.
- Chromium checked empty catalogue, draft creation, explicit publication, stock editing, consumer visibility and hiding, at widths 1440, 390 and 320 with no overflow or runtime exceptions. These browser checks used intercepted synthetic responses and made no backend writes. Screenshots are retained in `/workspace/artifacts/1vet/shop-catalogue` for this environment.
- Post-deployment aggregate checks confirmed public SELECT access, revoked authenticated mutation privileges, retained trusted stock updates, one eligible seller and zero public products.

The frontend must be deployed from the new main commit for the admin screen to appear. The production hostname was not browser-tested in this environment; local browser results do not establish production hosting deployment. No environment configuration was published and no payment flow was enabled.
