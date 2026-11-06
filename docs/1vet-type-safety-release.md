# Type safety and dependency security release

6 November 2026. No changes were applied to main Supabase, payment settings, or the published environment in this phase.

## Completed
- Resolved the baseline 331 TypeScript diagnostics while retaining strict mode, unchecked-index checks and override checks. Added `npm run typecheck` as a required CI step. No source files were excluded to obtain a pass.
- Upgraded to patched Vite 8.3.6, Vitest 5.1.0, React Router 7.18.5, Zod 4.6.7, current form resolvers/SWC tooling and TypeScript ESLint. React 18 and the existing application stack remain in place.
- Aligned Node 24 across package engines, `.nvmrc`, CI and Docker. Hosting/build environments must use Node 24 for this release.
- Narrow overrides patch vulnerable selector parsing, glob cancellation and minimatch dependencies retained by upstream packages. Lint and the production Tailwind/Vite build exercise these consumers. Review/remove overrides as upstream dependency constraints catch up.
- Fixed real render failures from missing Avatar and motion imports, unsafe array indexing, nullable messages/subscriptions/articles/stock, stale interface shapes, missing prescription dates and form input/output inference after Zod migration.
- Existing core pet profiles now load from the actual deployed `pets` table instead of failing because unrelated passport tables are absent. Existing core medical notes remain available. Structured passport/caregiver features are explicitly unavailable until their backend exists; the UI does not imply that missing modules mean an animal has no medical history. Removed a fake caregiver-invitation success message.

## Honest schema boundary
The generated main database types remain unchanged and accurate. They were not broadened to pretend planned tables are deployed.

Historical future-module SQL was reconstructed only in a network-isolated, disposable local PostgreSQL container. This exposed missing `products` foundations, a missing advanced booking total, a legacy mandatory listing ID and incompatible status reporting. The compatibility prerequisites are documented under `supabase/planned/`, outside the production migration directory. None were deployed to main.

`planned-types.ts` is a compile-only contract generated from that local blueprint, not a snapshot of main. Future services use a separate adapter that unconditionally throws `ModuleUnavailableError` before any request. It does not return mock successes or data. Flags cannot activate it accidentally; a reviewed schema deployment, permission validation and a real authenticated adapter are required first. Active main services continue to use main’s client. Unreleased portal routes and the advanced clinical workspace are visibly gated.

Rebuild these contracts locally with:

```bash
bash scripts/schema/check-planned-schema.sh
```

This validates SQL/type structure, not clinical, financial or authorization readiness of future modules. It never connects to main. Do not deploy the historical migration chain or planned foundations to production as part of this release.

## Verification
- Frozen `npm ci`: verified with the committed lockfile and normal TLS/integrity checks.
- Strict `npm run typecheck`: passes.
- `npm test -- --maxWorkers=2`: 37 files / 74 tests passed, including new checks that unreleased tables/RPCs cannot send requests and that core pet retrieval preserves real data and failures.
- `npm run build`: passes with the upgraded Vite/SWC/Tailwind toolchain.
- `npm run lint`: 0 errors; 9 existing fast-refresh warnings.
- `npm audit`: 0 vulnerabilities (previously 28, including 2 critical).
- Local blueprint reconstruction/generation: passes from a fresh disposable database.

Audit results cover the npm dependency tree at verification time, not every external hosted service. No new production browser, payment, PostgreSQL policy, Docker image or deployment conformance claim is made here. Existing backend repair evidence remains in `1vet-main-backend-repairs.md`.

Payments remain disabled as requested. The next feature milestone can implement the reviewed provider/booking backend or structured clinical passport, without bypassing these deployment boundaries.
