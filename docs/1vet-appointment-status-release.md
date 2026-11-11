# Appointment status and next steps — 11 November 2026

Appointment cards now explain awaiting confirmation, missed confirmation windows, confirmed appointments, past appointments still open, cancellations, declines and completion. Past confirmed records are not described as automatically completed, and missed requests are not described as automatically cancelled. Existing provider-eligibility warnings remain in place.

A new Past requests still open list view retrieves only past pending/confirmed records, scoped to the current customer or authorized provider. It supplements Upcoming and the existing closed-record history. Empty views offer context and a care-directory link for customers.

Participating accounts receive direct appointment-message links. The details page scrolls and moves keyboard focus to the conversation once the appointment loads. Existing conversation permissions still decide reading/sending access. Response actions share a synchronous lock against repeated pending clicks; server-side versions and permissions remain authoritative.

Validation: 357 tests in 93 files passed. Typecheck and production build passed; lint has zero errors and nine existing warnings. Added/updated tests cover status explanations, scoped past-open queries, message links and repeated responses. Chromium verified the past-open view, accurate status, message hash navigation and focus at widths 1440/390/320 without overflow or runtime exceptions. Synthetic intercepted responses were used; no real bookings/messages were changed. Session artifacts are under `/workspace/artifacts/1vet/booking-status`.

Deploy the new main frontend commit to expose the changes. No database migration or environment publication is needed. Production hosting was not browser-verified. Payments remain unavailable.
