# Correct veterinarian onboarding counts — 18 November 2026

The admin dashboard previously counted every user_roles row with role=veterinarian as a vet, even when the associated profile was an incomplete or unapproved registration. The metric is now explicitly labelled Onboarded vets and requires the existing is_verified_veterinarian criteria: veterinarian role, active profile, approved verification status and license_verified=true. It does not infer onboarding from role assignment alone.

Awaiting verification now counts pending profiles with a licence number and an applicant-owned, valid licence document. Incomplete registrations and documents belonging to another applicant are excluded from the ready-to-review queue. Existing approval/rejection actions and their trusted database auditing are unchanged. No roles, profiles, licences or approval flags were modified by this fix.

Role IDs are read in ordered pages and profiles are queried in bounded batches, avoiding a first-page-only count and oversized ID filters. Exact count metadata is required; unavailable count information fails visibly instead of presenting a fabricated zero. A Refresh dashboard action rechecks current data.

Validation: the regression fixture with one unapproved veterinarian role reports zero onboarded vets; tests also cover inactive, unverified, rejected and non-vet profiles, later role pages, empty roles, missing count metadata and valid submitted documents. Local Chromium verifies role-only=0, submitted=0 onboarded/1 awaiting, approved=1 onboarded, refresh and responsive widths 1440, 390 and 320 with intercepted synthetic data, without production writes. Screenshots: /workspace/artifacts/1vet/admin-vet-count/.

A read-only aggregate check against the configured production Supabase Management API returned HTTP 401. Live account state therefore remains unverified; the implementation and browser checks establish the corrected counting behavior, not the contents of the production database. No backend migration or environment publication was performed.
