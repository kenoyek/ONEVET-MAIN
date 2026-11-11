# Client onboarding and shop readiness

Completed 11 November 2026. Registration links previously opened the wrong account flow, returning unconfirmed users had no clear way to resend signup links, veterinary document replacement attempted protected verification writes, and the shop/cart displayed unsupported purchasing claims. These flows now have explicit next steps and tested failure states.

## Onboarding

| Audience | Signup URL | Next steps |
| --- | --- | --- |
| Pet owner / client | `/auth?mode=signup&role=client` | Confirm email, complete contact details, add an animal, find care. |
| Farmer | `/auth?mode=signup&role=farmer` | Confirm email, complete contact details, add farm/animal records. |
| Veterinarian | `/auth?mode=signup&role=veterinarian` | Confirm email, add licence number and document, await professional review. |
| Business provider | `/auth?mode=signup&role=service_provider` | Select a category, confirm email, register an organization, submit evidence for review. |

Vet entry links open veterinary signup. Protected organization-registration entry preserves provider intent when switching from sign-in to signup. The existing protected return path and database-verified portal routing remain intact. Dashboard next steps distinguish customers and business providers, and use owner-scoped counts for existing animals, farms and organizations.

`/auth?mode=confirm` requests another signup confirmation through the configured callback. It validates email, blocks duplicate pending requests, applies a 60-second client cooldown and uses generic acknowledgement/error text without claiming actual delivery. Signup confirmation and expired-link screens link to it. Email is passed internally in navigation state, not in public URLs.

## Veterinary verification

Licence upload requires a number and a PDF/JPG/PNG of at most 10 MB. Each upload uses a unique private Storage path without overwriting earlier objects. The number and document reference are attached together using normal profile fields; trusted database triggers reset approval and availability. Failed attachment attempts clean up unreferenced uploads. Upload refreshes preserve other unsaved profile fields.

The admin dashboard's individual licence queue now selects actual veterinarian accounts. Document links validate ownership and generate fresh 120-second signed URLs, including for older stored signed URLs. Approval is guarded against duplicate actions and pinned to the pending application's document and number. Organization review remains a separate workflow. Unapproved/inactive vets cannot go online, and dashboard guidance distinguishes clinical consultation availability from publishing bookable services.

Only `20261110010000_license_document_integrity.sql` was newly applied and tracked on main on 10 November; presence was confirmed on 11 November. Its restrictive policies prevent authenticated overwrite of licence objects and deletion of referenced documents while retaining owner upload and orphan cleanup. Other buckets and existing permissions are preserved. Earlier reviewed migration hashes were checked and skipped; no historical migration chain was replayed on main.

## Shop and cart

- Only active, approved listings are displayed. Product details use public seller fields rather than joining private profiles; unavailable seller names have a neutral fallback.
- Product links and cart actions are separate accessible controls. Search/category filtering, out-of-stock states, loading failures/retry and missing-product states are explicit. Empty live inventory is described as a shop being prepared.
- Account-scoped carts persist in the browser. Quantity changes respect current stock and the 99-unit cart limit. Invalid quantities are ignored, and monetary totals use minor currency units.
- Opening the cart rechecks live prices and stock. Quantities are reduced to current availability; removed/unapproved/out-of-stock items remain visible for removal but are excluded from available-item totals. Failed revalidation preserves the cart and offers retry.
- Unsupported ratings, guaranteed delivery, free shipping, verified-seller claims and instant-payment merchant promises were removed.
- Payments remain unavailable as requested. Checkout preserves the cart, explains that no order/payment has occurred and links to support. The old client-priced order insertion/payment code was removed; future purchasing must use a reviewed server-priced order/stock flow.

## Verification

- Final frontend suite: **318 tests passed** across 84 files. TypeScript and production build passed. ESLint has zero errors and nine existing Fast Refresh warnings.
- Isolated database CI: **392 SQL assertions and five concurrency checks passed**, including the new licence-integrity regressions. Separate farm ownership regressions passed.
- Main rollback-only verification: **18 signup/approval/audit checks, 37 organization-registration checks and seven licence-storage checks passed**. Test users, objects, functions and organizations were confirmed removed by rollback. Storage metadata deletion checks emulate the Storage API transaction flag while retaining authenticated RLS; no real file objects were uploaded or deleted.
- Chromium production preview: four signup audiences with correct SDK payloads; confirmation resend/cooldown and expired-link recovery; protected provider entry, sign-in errors/success and protected returns; password recovery; vet upload/review and customer/business next steps; product/cart/paused-checkout journey, persistence, stock/price changes, unavailable items and failure retry. Twenty-eight responsive views plus authentication regressions were exercised with synthetic API responses; no unhandled browser exceptions. No real emails, approvals, orders or files were sent/created by browser tests.
- The final profile adjustment also has focused tests for attaching the entered number, refusing an upload without it, and retaining unsaved contact fields after refresh.

Screenshots are under `/workspace/artifacts/1vet/onboarding-shop/`. Database and frontend run logs are under `/tmp/onevet-launch-*` and `/tmp/onevet-onboarding-completion-tests.log` in this workspace.

## Actual launch state

Read-only inspection on 11 November found **0 approved vets, 0 approved active organizations, 0 published services, 0 booking-enabled providers and 0 active approved shop products**. No fake inventory or professional records were added to fill those gaps.

Auth inspection on 10 November confirmed signup enabled, email confirmation required, correct 1vet.store/www callback URLs, custom SMTP configured, and a 30-email/hour limit with a 60-second send frequency. Auth configuration was not changed. Real inbox delivery remains unverified.

Deploy the new main commit to activate the frontend fixes. Onboard and approve real professionals/organizations, publish services and availability, and supply the real product catalogue before offering appointments or purchases. Account registration can be piloted after a real confirmation-email check. Online purchasing remains paused. Environment configuration was not published by this task.
