# Veterinarian onboarding progress — 18 November 2026

The Admin Center veterinarian tab now separates incomplete registrations from submitted applications and approved, active, licence-verified vets. Previously, correcting the onboarded count left incomplete registrations invisible to administrators.

The new read-only section lists pending applicants whose licence number is blank or whose licence document does not belong to their account. Each applicant shows the exact missing requirements, contact email and registration date. It offers no approval or rejection actions. Applicant-owned documents and licence numbers remain required for entry to the existing review queue. Completing these requirements moves an applicant out of the incomplete list on refresh, without increasing the onboarded count. Approval and clinical eligibility rules are unchanged.

The section reuses the existing bounded, paginated queries, adds no database queries or schema changes, and does not send messages or modify account records. Submitted application cards now stack their controls on small screens and wrap long email addresses.

Validation: eight service tests cover eligibility, multiple role pages, missing counts, missing and foreign documents, and draft-to-review-to-approved transitions. Strict type checking, lint (zero errors; nine existing warnings), and the production build pass. Local Chromium uses synthetic intercepted data to check missing requirements, separate counts, refresh transitions and responsive layouts at 1440, 390 and 320 pixels; no production records are written. The full suite passes all 474 tests across 121 files. Screenshots are under /workspace/artifacts/1vet/admin-vet-incomplete/.

Production Supabase account state was not inspected in this phase; the previous read-only Management API attempt returned HTTP 401. No backend deployment or cloud environment publication is required by this change.
