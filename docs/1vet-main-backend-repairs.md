# Main Supabase backend repairs

6 November 2026. Authorized remote target: `onevet-production` (`fxvctkfhitpgfyaztqor`). No staging project or environment publication was used.

## Live findings
The initial read-only inventory found 18 original public tables, all with RLS, but no farm or provider-organization tables and no migration history. The live payment-completion SECURITY DEFINER functions were executable by anonymous and authenticated clients. Profiles could update their own verification fields; all veterinarian roles could read all pets. Public profile views exposed private customers, audit/notification INSERT policies accepted arbitrary writes, and avatar uploads were not restricted to the caller’s folder. Pending consultation claiming was not implemented atomically.

The backup endpoint reported no retained backups and PITR disabled. No customer rows were exported or altered for these repairs. Private pre-change schema/function/grant metadata and the previous verification-function bundle were retained in this execution environment; these are not full database backups. Future destructive/data-repair work needs a verified backup/recovery path.

## Applied and tracked migrations
Only these new repairs were applied through the official Management API. Their tracking names include the source filename/version and SHA-256 prefix. Historical migrations were not replayed or falsely marked as applied.

| Source file | Result |
| --- | --- |
| `20261106010000_live_security_repairs.sql` | Server-only payment helpers; protected verification fields; authoritative signup roles/email verification; recipient-only notification reads/read marks; trusted audit writes; assigned-approved-vet pet access; clinical write protections; atomic vet claim RPC; curated service discovery; private profile visibility; own-folder avatar uploads |
| `20261106020000_payment_receipt_ledger.sql` | Trusted settlement RPC, unique payment receipts, exact amounts/currency, owner checks, catalogue-derived item prices, reference replay protection, serialized stock decrement and subscription settlement |
| `20261106030000_bootstrap_customer_farms.sql` | Provisioned the three missing farm tables with the reviewed owner-scoped policies in one transaction; preserved existing secured installations; no parent-deletion path through customer RLS |
| `20261106040000_public_read_boundaries.sql` | Read-only public views; suspended-vet clinical/message revocation; private notification counts; trusted server audit for verification changes |

The deployment runner is `python scripts/deploy-reviewed-repairs.py` (inspect pending state) or `python scripts/deploy-reviewed-repairs.py --apply` (explicit apply). It is deliberately limited to this reviewed set, checks the recorded hash, and stops if an applied source differs. It never logs the management token. Do not run an unrestricted historical `supabase db push` against this manually bootstrapped legacy project.

## Payment status: intentionally unavailable
The user explicitly chose to leave payments unavailable. Main had no Paystack secret at inspection.

- Deployed `verify-payment` version **3**, ACTIVE, with gateway JWT verification retained.
- Function authenticates the user, checks target ownership, verifies Paystack’s status/reference/exact amount/NGN/payer/metadata, then calls the transactional settlement RPC. Internal error details are not returned.
- Server requires both the merchant key and `PAYMENTS_ENABLED=true`; the switch is off by default.
- Frontend `payments_enabled` defaults to false. Checkout and subscription payment actions are disabled with a clear message. Checkout does not create a new order when disabled, and the payment hook will not open a popup, even if a public key exists.
- Production ignores localStorage attempts to override the payment gate.

No real payment, charge, refund or payout was initiated. Live Paystack success/webhook/reconciliation behavior is not verified. Server-created payment intents and signed webhook delivery remain a separate milestone before enabling billing. Do not enable either payment flag merely because a key has been entered.

## Frontend and schema integration
- Generated database types now come from the repaired main public schema.
- Farm records are enabled by default for the inspected main backend; `VITE_FEATURE_CUSTOMER_FARMS_ENABLED=false` remains the rollback switch.
- Discovery uses the curated `care_service_directory` view over existing service listings and approved profiles, rather than querying nonexistent organization tables. It does not invent fees, durations, channels or emergency coverage.
- Legacy veterinary listings lead to consultation requests; other services lead to support enquiries. No fake organization slugs or unsupported advanced booking targets are emitted.
- Organization onboarding is gated off until its backend is implemented. Existing professionals can complete their profile; other users can request professional access through support.
- Vet acceptance uses the atomic `claim_consultation` RPC. Availability controls reflect professional approval; backend checks remain authoritative.
- Admin verification relies on the server audit trigger instead of attempting untrusted client-side audit inserts or synchronizing nonexistent organization records.

## Verification
- **71 application tests passed** across 36 files, including payment authentication, owner/metadata/amount/currency/reference mismatch, settlement failure and disabled-payment popup prevention.
- **46 local PostgreSQL assertions passed** using the original master schema plus the exact repair migrations. Cases include forged payments, reference replay, authoritative prices, single stock decrement, signup role safety, clinical permissions, public directory filtering, protected uploads, private profile writes/counts, farm ownership, audit generation and suspended-vet access.
- The same **46 assertions passed on main** with randomized synthetic users/records inside an explicit rollback-only transaction. Follow-up metadata checks confirmed zero temporary test users/functions remained. No emails were sent via GoTrue and no test customer/payment records were committed.
- Main grant checks: anonymous/client legacy payment execution denied; client settlement execution denied; public-profile view UPDATE denied; anonymous curated-directory SELECT allowed. All three farm tables and four tracked repairs are present.
- Production frontend build passes. Lint: 0 errors / 9 existing warnings.
- Strict TypeScript still fails in legacy/undeployed advanced modules; this release is not full repository type safety. Previously recorded dependency advisories remain a separate upgrade task. No new Lighthouse, WCAG or compliance certification is claimed.
- CI now uses frozen npm installation and requires the application tests plus core/farm PostgreSQL security regressions. Build is accurately named as a frontend build, not a strict type check.

Main role tests validate actual PostgreSQL enforcement. They do not claim browser login, PostgREST traffic, Storage API uploads, real-time delivery, or real payment completion was exercised on production.

## Release and recovery
Push validated code to `main` under the standing delivery instruction. No Vercel deployment status or environment publication is inferred from Git push. Keep payments disabled. To pause farms, set the frontend flag false and rebuild. Preserve new farm/receipt records and use forward fixes; restoring the old permissive policies would reopen confirmed vulnerabilities. Remaining organization/scheduling/video/notification-worker functionality needs its own reviewed schema and workflow implementation.
