# Farm onboarding next steps — 14 November 2026

A successful standalone farm registration now leaves a persistent confirmation with the saved farm's name, a link to its animal-group workspace and a marketplace shortcut. Clients can dismiss the confirmation without removing the record. Appointment-driven registration retains its existing direct handoff to farm-group selection.

Farm, animal-group and observation forms now disable all editable controls during a pending save and expose their busy state. This prevents the visible inputs changing while the submitted snapshot is being processed. Controls unlock after failed requests so existing retry/recovery protections remain usable.

Validation covers the farm→group→observation journey, confirmation destinations/dismissal, booking return, retry recovery and pending-field locking for all three forms. Application/API typechecks, lint and production build are included. Local Chromium checks use synthetic intercepted backend responses to verify confirmation, lost-response recovery and layouts at 1440, 390 and 320 pixels; they make no production writes and do not verify live deployment.
