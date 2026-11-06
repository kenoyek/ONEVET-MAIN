# Customer portal release — implementation and rollout

6 November 2026. Builds on the public foundation in commit 660658c. This release is implemented and tested locally; no live Supabase changes or deployment were performed.

## Delivered
- Customer dashboard with pet and farm entry points, recent consultations, pet profiles, membership state, and recent orders. Failed retrieval is distinct from a genuine empty account; no placeholder success metrics.
- Dashboard schema fixes: `subscriptions.user_id` and `orders.customer_id`, matching the existing migration, replace the old `user_subscriptions`/`orders.user_id` assumptions. Requests are scoped to the current profile/auth identity.
- Customer preference for pets, farm animals, or both, editable later. It writes only `profiles.customer_type`, not roles. Existing `livestock_owner` preferences display as farm animals.
- Farm list and detail routes `/farms` and `/farms/:farmId`. Create a farm, add a flock/herd/pond/batch with species, registered population and production stage, and append health observations. Dates display in Africa/Lagos (WAT).
- Owner observations are explicitly separate from diagnosis and prescription. Mortality counts cannot exceed affected animals; affected animals cannot exceed registered group size. Observations do not automatically change population counts. Existing clinical text is displayed as recorded, without new clinical authoring controls.
- Persistent carts scoped per authenticated identity, plus a separate guest cart. The old shared `1vet-cart` value is preserved but not imported because ownership cannot be established. Malformed stored items are ignored.
- Account identity changes remount the routed application so component-local state cannot survive into another account. Existing query-cache clearing and profile-generation guards remain. Metadata no longer creates or supplies fallback frontend roles; missing/failed role lookups show a protected-route error with retry.
- Pet collection page gets correct fixed-header spacing, accessible filters, and a distinct backend error/retry state.

## Schema and authorization
`src/integrations/supabase/customer-schema.ts` is a narrow, manually reviewed type extension for the existing farm tables, orders, and `profiles.customer_type`. It is not a generated snapshot of the live backend. The rest of the generated-schema drift remains outstanding.

Migration `20261106000000_customer_farm_ownership.sql` is transactional and preserves existing rows. It:
- refuses to apply if it finds unknown farm policies, since PostgreSQL combines permissive grants;
- removes blanket veterinarian farm/group visibility;
- permits owner/admin farm and group reads, inserts and updates with ownership checks on both old and new rows;
- retains visibility of explicitly assigned health records for veterinarians and existing admin visibility;
- permits owners to append observations only to their own active/quarantined groups, under their own profile, without clinical treatment/assignment fields;
- does not grant parent deletion, preventing cascade removal of health history through these customer operations;
- adds `NOT VALID` checks that enforce new writes while preserving historical rows for review.

There is no new clinical-sharing consent UI. Farm/group targets are not forced into pet-only consultation/booking foreign keys. Booking atomicity and payment reconciliation remain separate work.

## Verification
- Production build passes.
- Vitest: **34 files / 59 tests passed**, including create-farm → create-group → append-observation form flow, unavailable farms, API failures/retry, numeric validation, account cart isolation, dashboard ownership filters, preference saving, metadata-role denial, and production rollout gating.
- Isolated PostgreSQL 16: **27 assertions passed**, including migration rejection of unknown policies, positive owner writes, cross-owner read/write denial, forged author/treatment denial, count limits, prevention of parent deletion, scoped veterinarian visibility, admin visibility, and anonymous denial.
- `npm run lint`: 0 errors / 9 existing warnings.
- Strict TypeScript still fails in older modules. The new farm/customer schema, workspace, data hooks and regression tests have no reported diagnostics. This does not certify the full repository.
- Chromium desktop/mobile customer dashboard and desktop/tablet/mobile farm records render without horizontal overflow. Browser form flow creates a farm, group and dated observation using **intercepted local fixtures only**; all Supabase HTTP responses in that browser were supplied locally. No real customer accounts, health data or backend writes were used.
- Screenshots: `/workspace/artifacts/1vet-phase2/`. These contain visibly named test fixtures and are review evidence, not live account screenshots.

Run database checks with:

```bash
bash scripts/test-farm-rls.sh
```

The runner creates a temporary PostgreSQL container with no network or published ports and removes it on exit. It pins the image digest. The bootstrap supplies minimal Auth/profile/role helpers, then applies the actual original farm migration and new migration. This verifies PostgreSQL policy behavior, not full Supabase migration-chain or PostgREST deployment compatibility.

## Rollout gate
The farm portal is **off by default**. `VITE_FEATURE_CUSTOMER_FARMS_ENABLED=false` is documented in `.env.example`.

1. Back up the target database and inspect existing farm policies, helpers, grants, row counts, and schema compatibility. Review the narrower vet/admin access and deletion behavior with operations.
2. The user has selected the main Supabase project as the remote target; no staging project is required. Run the local PostgreSQL tests, then inspect the main schema, policies, helper definitions and migration history read-only. Validate deployed PostgREST permissions with designated test identities and synthetic records only. Local policy tests alone do not establish main-project compatibility; resolve differences before applying the migration.
3. Apply the reviewed migration using the normal controlled deployment process. Do not drop unknown policies blindly; the migration deliberately stops for their review. Review historical invalid rows before separately validating the `NOT VALID` constraints.
4. Only then set `VITE_FEATURE_CUSTOMER_FARMS_ENABLED=true` and rebuild/deploy the frontend. Production builds ignore localStorage attempts to override this gate. The gate is a rollout control, not an authorization boundary; RLS is mandatory.
5. Smoke-test owner creation, cross-owner denial, failed requests and WAT display on that target before promoting the release.

For local development, the existing feature-flag helper allows a dev-only override. Production fixtures or invented success data are never seeded by application code.

## Rollback and limitations
Disable the build flag and restore the previous frontend deployment first. Keep created farm records; do not restore the old permissive policies as a routine rollback. Use a reviewed forward fix for database issues. Do not down-migrate or delete clinical/customer data.

This phase does not deploy the migration, configure a production environment flag, create real accounts, certify compliance, resolve the dependency advisories, or complete payment/video/scheduling work. Account deletion and record retention need approved policies and separate backend workflows. The next consultation milestone should address authoritative slot reservations, provider approval, price calculation, participant access, and payment intent/webhook reconciliation.
