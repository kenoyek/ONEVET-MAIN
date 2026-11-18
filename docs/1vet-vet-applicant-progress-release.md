# Veterinarian applicant guidance — 18 November 2026

The veterinarian profile and dashboard now share professional onboarding status logic. Previously, the profile labelled any partial licence submission as pending and used the licence-verified flag alone to display verification. Rejected or inactive profiles could receive misleading guidance.

The profile now shows a checklist for a saved licence number and an applicant-owned licence document. Only a complete pending profile is described as awaiting review. Rejected applicants are directed to correct their professional details and upload a replacement document; inactive accounts and inconsistent approval states receive a support link. Professional approval requires an active profile, approved verification status and a verified licence, matching the existing clinical eligibility flags for veterinarian accounts.

The dashboard uses the same guidance and context-specific action. Links to /profile#credentials scroll to the credential section after the authenticated owner profile is ready. The document attachment caption reports that a document is saved rather than claiming every saved file is processing or approved. The checklist reflects saved account data, not unsaved form edits. Existing upload validation, applicant ownership checks, approval controls and database rules remain unchanged.

Validation: all 480 tests across 122 files pass, including six new status tests and the existing profile upload/unsaved contact recovery tests. The upload test mock now retains the real document ownership helper while mocking only uploads. Strict type checking, production build and lint pass (nine pre-existing lint warnings, zero errors). Local Chromium checks use intercepted synthetic accounts for incomplete, pending, rejected, inactive and approved states and widths 1440, 390 and 320; no production writes are performed.

No schema migration, backend deployment, payment change or environment publication is included. Live Supabase records were not inspected; the last Management API check returned HTTP 401.
