# Product architecture and release plan

Retain Vite/React, Supabase, Paystack and Vercel. Work in the existing isolated checkout. Do not migrate providers for visual redesign. Production data is outside this task.

## Boundaries
Identity owns sessions/profiles/roles; verification owns credentials and approval; animal health owns pets/caregivers and farms/batches; booking owns service availability and appointment state; consultation owns participants/messages/clinical summaries; finance owns immutable payment events/refunds/payouts; notification owns templates/outbox/delivery; operations owns scoped support and audited administration. Existing services and tables are the starting point, not instructions to duplicate entities.

## Authoritative flow to implement next
Client selects published service → authenticated server validates approval/ownership and prices → atomic slot reservation plus expiry → server-created Paystack intent → signed webhook or authenticated verification → idempotent ledger reconciliation → confirmed consultation and outbox event. Server owns all price, clinical authorization and state transitions. A preflight availability check cannot reserve a slot. Store instants with timezone-aware timestamps and display Africa/Lagos with an explicit zone label. No recording by default.

Farm health reuses livestock_farms/livestock_batches/flock_health_records. Add group targets to consultation/booking only after reviewing live foreign keys and ownership; never force a flock into a fake pet row. Account audience preference is separate from privileged roles.

## Current release boundary
Public design and navigation improvements preserve all old routes and auth guards. Pet/farm pages explain what is available to request and what remains planned. Provider discovery reuses existing backend without fake cards or credentials. No schema, production data, payment deployment or new communications provider in this release.

## Next-release acceptance gates
Disposable Supabase project restored from reviewed migrations; anonymized fixtures only. Two customers, approved/pending/suspended vets, provider staff and scoped admins. Prove cross-owner denial for each table/bucket/RPC; slot concurrency and timezone tests; webhook replay/wrong-currency/wrong-owner tests; logout/account-switch cache tests; upload validation and private clinical documents; email/recovery tests. Build and lint do not substitute for these tests.

## Deployment and rollback
Create a reviewable commit/PR after local tests; deploy preview against a disposable backend with isolated test Paystack credentials. Check desktop/mobile/keyboard and production assets. Roll out frontend via Vercel preview then controlled production promotion. Keep last successful Vercel deployment for rollback; this release has no database migrations. Future schema work uses additive migrations, backup verification, dry-run and a separately reviewed rollback/forward-fix plan. Never down-migrate shared medical/payment data blindly. Observe error rates and booking/payment reconciliation before increasing traffic.

## Evidence and remaining work
See 1vet-platform-audit.md and 1vet-release-validation.md for exact scope and checks. Future AI assistance, farm intelligence, regulated marketplace and referral credits require separate milestones and business review. Do not advertise them as launched.
