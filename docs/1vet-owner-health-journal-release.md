# Owner health journal — 9 November 2026

Pet profiles now include a private owner health journal with weight measurements in kilograms, reported vaccinations and care notes. Entries have an observation date, optional notes and an optional owner-supplied vaccination due date. Past and current due dates are identified using the Africa/Lagos calendar. These are owner reports, not verified clinical records, vaccination certificates, prescribing tools or a veterinarian-authored passport. No automatic notifications are scheduled.

The journal does not change the pet's profile weight when a historical measurement is recorded. Existing vaccination-history JSON, medical notes and clinical consultations are preserved without being relabelled as verified records. Structured clinician records, document uploads and caregiver sharing remain unavailable. The pet header now says “Pet profile” instead of advertising an active digital passport.

## Access and corrections

Only the current active profile owner can read or change journal entries. Provider team membership, veterinary roles and global administrator status confer no journal access. Clients cannot directly insert, update or delete entries. Server functions derive the author from the authenticated session, lock the active profile and pet, and validate types, dates, lengths, positive finite weight and due-date ordering.

Request keys belong to the sending account and are bound to the normalized payload and pet. Repeated and concurrent identical requests return one entry; changed payloads are rejected. An owner may add up to 50 entries per rolling day; idempotent retries still work at that limit. A correction marks an entry incorrect with a 5–500 character explanation. Original content and the first correction reason remain visible; a replacement is a separate entry. Corrected vaccination entries no longer display active due-date labels. Metadata-only audit events record entry identifiers without health text.

Journal entries remain while the pet profile exists. The foreign key follows the existing profile-deletion behavior with cascade deletion; this phase does not introduce a new clinical retention policy or public sharing. Client-side controls cannot bypass server ownership or active-account checks.

## Interface reliability

History uses pages of 20 with a stable date, creation-time and ID ordering. Network errors show a retry action, keep drafts and avoid presenting failed history as an empty journal. Drafts and query keys are scoped to account and pet; lost-response retries reuse the same request key. Access checks recur every 30 seconds and hide cached content on failure.

The pet details page remounts its data and dialogs when either account or pet changes. Delayed profile and consultation responses from an unmounted account are ignored. Profile failures show a retryable page, and consultation failures no longer appear as “no consultations.”

## Deployment and verification

Only the additive `20261109020000_pet_owner_health_journal.sql` migration was newly deployed to main project `fxvctkfhitpgfyaztqor`; existing tracked migration hashes were verified without replay. Main schema inspection confirmed the journal was absent before application. Generated types were refreshed from main. A small reviewed client contract supplies the SQL nullability of weight and due-date arguments that PostgREST type generation omits.

- Type checking, production build and lint pass (zero lint errors; nine existing fast-refresh warnings).
- 203 frontend tests pass, including account/pet transitions, delayed responses, lost-response retries, corrections, due dates, literal text rendering, pagination and failure states.
- Disposable PostgreSQL: 382 SQL assertions and five concurrency races pass. The new race proves concurrent identical health-entry requests create exactly one entry and audit event.
- Main: 36 randomized journal checks pass in a rollback-only transaction; follow-up checks confirm no fixture users, functions, organizations or storage objects remain.

Chromium verifies the production build using intercepted synthetic APIs: saving one report, showing HTML-like notes as literal text, preserving the corrected measurement, and fitting a 390-pixel mobile viewport. This is fixture-based UI verification, not real-account clinical testing.

Payments remain unavailable. No environment configuration was published.
