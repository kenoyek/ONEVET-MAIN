# Provider service publication

Owners can prepare private service drafts in the organization workspace, then explicitly publish eligible services to the care directory and `/provider/public/:slug`. The workspace explains which details become public and requires acknowledgement before enabling its publish button. It supports editing, unpublishing, retry feedback and stale-change protection.

The public catalog exposes organization name/identifier/category, city/state/country and provider-entered service descriptions, duration, delivery mode and NGN base fee. Registration email, phone, street address, owner identifiers, documents and review snapshots stay private. Public provider pages show only currently eligible published services. An unpublished, suspended or otherwise ineligible provider receives the same unavailable state.

## Publication rules

Draft creation/editing and publication use trusted RPCs. Clients have no direct service-table writes. The server derives the caller, requires an active owner membership/account, matches the service category to the organization, validates fees/durations, caps organizations at 50 services, and locks the organization to serialize changes. Edits and publication check the expected service version. Published details must be unpublished before editing.

Current supported categories are veterinary care, grooming, diagnostics and training. Supported delivery modes are provider-location and home visits, with declared durations of 5–480 minutes and nonnegative NGN base fees with two-decimal precision. Pharmacy and pet-store service publishing, remote consultations, emergency coverage, deposits and fee/tax calculations are not introduced here.

Publishing requires approved organization and verification-case status, current submitted documents, an active owner, and applicable professional-licence evidence. Veterinary categories also require the owner's current individual veterinary approval. Publishing activates the organization and primary location; unpublishing the final service deactivates them while preserving any administrative suspension.

Every catalog query rechecks approval, credentials and owner status. Expired evidence, suspended ownership or organizations, inactive accounts, and revoked veterinary approval hide listings on subsequent queries. Public directory/profile queries refresh on entry/focus and poll once per minute while active. Publication and editing create trusted audit events.

Existing approved individual-provider listings remain in the directory. Existing veterinary care requests retain their consultation route. New organization listings lead to provider details; appointment booking and payment activation remain disabled. Published services do not claim appointment availability, and the public page explains this.

## Deployment and validation

Migration `20261106080000_provider_service_publication.sql` was applied and tracked on main `onevet-production`; the live TypeScript contracts were regenerated. No historical migration chain was replayed, existing customer rows were not rewritten, and no environment publication was performed.

- 161 local PostgreSQL assertions: existing security/draft/verification checks plus 33 publication checks, in a disposable container without networking.
- 33 publication assertions on main using randomized fixtures in a rollback-only transaction. Follow-up confirmed zero fixture users, helper functions, organizations or Storage metadata records.
- 106 frontend tests, including publication acknowledgement, unapproved organizations, stale edits, fee precision, public empty states, declared fees, and routes that preserve existing veterinary care requests without enabling new bookings.
- Strict TypeScript and production build pass. Lint reports zero errors and nine existing fast-refresh warnings. Dependencies are unchanged.

Run `bash scripts/test-core-security.sh` locally. `python scripts/verify-provider-publication.py` previews the assertion count; `--main` runs the rollback-only main checks with the configured Management API credential.

The SQL/catalog behavior was tested through PostgreSQL and the main Management API; frontend behavior was tested with component/service tests. An authenticated deployed-browser publishing session and browser-to-PostgREST requests were not exercised in this environment. Directory searches currently use the project's bounded catalog response alongside the existing bounded individual-provider query; a paginated combined search remains a future scaling improvement.
