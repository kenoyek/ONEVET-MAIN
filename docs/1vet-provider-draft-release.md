# Provider organization registration

This release enables private organization drafts on the main `onevet-production` Supabase project. Signed-in customers and professionals can register an organization, return to its workspace, and edit its business details and primary location. `/provider/register` lists the current account's organizations; `/provider/organization/:slug` opens an owner-scoped workspace.

The database creates the organization, owner membership, primary location and trusted audit event in one transaction. It derives ownership from the authenticated account, requires an active profile, validates Nigeria/WAT/NGN details and actual location fields, and serializes registrations per account to enforce a ten-organization cap. A failed location write rolls back the entire registration. Slug and business category remain fixed after creation.

All three new tables have row-level security. Clients have read-only table grants; creation and editing use `save_provider_draft`. Organization and location visibility is restricted to the creator, and membership visibility to the member. Clients cannot assign members, change ownership, self-approve, change professional roles or alter verification. Editing is limited to active owners of drafts, and suspended organizations cannot be edited.

New organizations and locations start inactive. Registration grants no clinical permissions and changes no personal license verification. Organization verification submission, document review, invitations, service publishing, availability and booking activation remain unavailable. Existing consultation and farm workflows continue to use their deployed backend. Payments remain disabled.

## Deployment and validation

The additive migration `20261106050000_provider_draft_registration.sql` was applied and tracked on main using `scripts/deploy-reviewed-repairs.py --apply`. Existing migrations were verified by source hash. No historical migration chain was replayed and no existing customer rows were rewritten. The main schema TypeScript contracts were regenerated after deployment.

- Local PostgreSQL: 83 assertions, comprising 46 core security regressions and 37 provider checks; disposable container, no networking, fixtures rolled back.
- Main PostgreSQL: 37 provider assertions in a randomized rollback-only transaction. Independent follow-up confirmed zero remaining fixture users, organizations or helper functions.
- Frontend: 83 tests, including save failure/retry, duplicate-submit prevention, immutable fields, unsafe input rejection, loading and access-error states.
- Strict TypeScript and production build pass. Lint has zero errors and nine existing fast-refresh warnings. Dependency audit reports zero vulnerabilities.

Repeat local database checks with `bash scripts/test-core-security.sh`. `python scripts/verify-provider-drafts.py` previews the assertion count; `--main` runs the rollback-only main checks using the configured Management API credential. The latter requires permission to create temporary auth fixtures and execute SQL. It never commits fixtures.

Validation covered SQL permissions through the Management API and frontend behavior through component/service tests. Browser-to-Supabase requests and a deployed browser session were not exercised in this environment. No environment publication was performed.
