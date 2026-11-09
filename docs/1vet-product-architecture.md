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
Use local disposable PostgreSQL fixtures for automated tests, then inspect the main Supabase project read-only before applying changes. No separate staging Supabase project is required; use synthetic data only for targeted main-project validation. Two customers, approved/pending/suspended vets, provider staff and scoped admins. Prove cross-owner denial for each table/bucket/RPC; slot concurrency and timezone tests; webhook replay/wrong-currency/wrong-owner tests; logout/account-switch cache tests; upload validation and private clinical documents; email/recovery tests. Build and lint do not substitute for these tests.

## Deployment and rollback
Standing delivery preference: commit and push completed, validated implementations to main. Fetch first, preserve unrelated work, and never force-push. Keep backend migrations and rollout flags controlled separately. The main Supabase project is the authorized remote backend target; do not require or create a separate staging project. Validate migrations locally, inventory the main schema and policies read-only, and verify backup/recovery before applying targeted changes. Use Paystack test mode for payment validation. Check desktop/mobile/keyboard and production assets. Roll out frontend via Vercel preview then controlled production promotion. Keep last successful Vercel deployment for rollback; the public release had no database migrations; the customer release includes an unapplied ownership migration. Future schema work uses additive migrations, backup verification, dry-run and a separately reviewed rollback/forward-fix plan. Never down-migrate shared medical/payment data blindly. Observe error rates and booking/payment reconciliation before increasing traffic.

## Evidence and remaining work
See 1vet-platform-audit.md and 1vet-release-validation.md for exact scope and checks. Future AI assistance, farm intelligence, regulated marketplace and referral credits require separate milestones and business review. Do not advertise them as launched.

## Customer release implementation update
The customer dashboard, audience preferences, account-scoped carts, and gated farm/group/observation workspace are now implemented. See `1vet-customer-portal-release.md` for the scoped schema extension, migration, 27 PostgreSQL assertions, browser-fixture evidence and required target-backend rollout gates. The earlier public-release boundary above is historical. This release does not implement farm-target consultation foreign keys or deploy backend changes.

## Main backend repair update
Four repair migrations are now applied and tracked on main. Payment helpers are server-only, profile and clinical permissions are enforced, farm tables are provisioned, and discovery uses the actual legacy listing schema. Payments remain intentionally unavailable by user instruction. See `1vet-main-backend-repairs.md` for the 46 rollback-only main checks, 71 application tests, deployed function version and remaining scope.

## Type-safety release update
Strict TypeScript and the npm advisory backlog are now resolved; see `1vet-type-safety-release.md`. Main’s generated schema remains authoritative. Undeployed modules are compile-checked separately and blocked before network access; they are not enabled by type generation. Node 24 is the required runtime. No main-project migration or payment activation occurred in this phase.

## Owner health journal update

The owner-recorded pet health journal is deployed on main with isolated owner access, idempotent entries and preserved correction history. This is distinct from the still-unavailable clinician-authored passport and caregiver sharing. See `1vet-owner-health-journal-release.md` for scope and validation. Payments remain unavailable.
