# First appointment request readiness — 14 November 2026

The appointment request now explains missing requirements beside the submit action: animal selection, current availability, contact phone, home-visit address where applicable, and acknowledgement of request terms. The submit button references this status for assistive technology. A complete form clearly states that provider confirmation is still needed.

A valid phone from the matching signed-in profile is prefilled. Once the customer edits the phone, subsequent profile updates cannot overwrite it. Contact readiness requires 7–15 digits and the existing 40-character limit; home visits require the existing 10–500-character address range. Invalid contact details block both the button and programmatic form submission. No payment is collected.

Existing availability refresh, changed-service consent reset, slot conflict handling and idempotent retry behavior remain in place. No database migration or booking-policy changes are included.

Validation covers missing requirements, non-phone contacts, home-visit address readiness, prefill/edit preservation, repeated submits, ambiguous retries, expired times and slot conflicts. Application/API typechecks, lint and production build are included. Local Chromium checks use synthetic intercepted responses to verify prefill, missing and ready states, and layouts at 1440, 390 and 320 pixels without creating live bookings. They do not verify production deployment.
