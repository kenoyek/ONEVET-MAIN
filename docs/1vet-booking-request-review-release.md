# Booking request review and recovery — 11 November 2026

The booking form now displays a review summary of the selected animal, provider, current available time and base fee before submission. It clarifies the delivery arrangement, private address sharing for home visits, and that requests require provider confirmation and collect no online payment.

A synchronous action lock blocks duplicate pending submissions. Submission also requires a currently listed slot, valid date, current service consent and valid selected animal; it is blocked during service/availability refreshes. Contact validation remains subject to server checks. A slot conflict clears the selected time while retaining contact details; unavailable shared times receive an explicit prompt to choose again. Ambiguous network failures preserve input and reuse the existing idempotency key for an unchanged request.

Form state is scoped to account and service. A request that completes after the form is unmounted no longer navigates the user to the old appointment. Existing backend authorization, availability checks and confirmation semantics are unchanged.

Validation: 351 tests in 92 files passed; typecheck and production build passed. Lint has zero errors and nine existing warnings. New tests cover duplicate events, review content, network retry keys, retained input, slot conflicts and expired shared times. Chromium verified selected-time review and a simulated conflict, including contact retention and exactly one intercepted request, at widths 1440/390/320 without overflow or runtime exceptions. No real bookings were created. Session artifacts are under `/workspace/artifacts/1vet/booking-review`.

Deploy the new main frontend commit to expose the changes. No database migration or environment publication is needed. Production hosting was not browser-verified. Payments remain unavailable.
