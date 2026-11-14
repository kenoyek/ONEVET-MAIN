# Saved-pet next steps — 14 November 2026

Adding an animal outside an appointment request now shows a dedicated saved-profile confirmation, with direct links to the created record, care services, marketplace and customer dashboard. The confirmation appears only after the backend acknowledges a record. Keyboard focus moves to its heading. It explains that profile creation does not confirm an appointment or treatment.

The existing booking return path continues directly to the appointment request with the new animal selected. Duplicate-submit locking, ownership checks, stable creation IDs and recovery after a lost response retain their existing behavior. Failed standalone writes keep the form and expose retry feedback.

Validation includes standalone save confirmation and destinations, failure feedback, booking handoff, repeated clicks and duplicate recovery. Application/API typechecks, lint, production build and the full regression suite are run. Local Chromium checks use synthetic intercepted backend data and verify confirmation, saved-profile target, focus and layouts at 1440, 390 and 320 pixels. No live animal records are created; these checks do not establish a production deployment.
