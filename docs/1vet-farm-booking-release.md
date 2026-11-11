# Farm-group booking onboarding — 11 November 2026

Veterinary and diagnostic booking forms now link directly to farm-group setup when no suitable animals exist, and offer an add/choose group path when clients already have other animals. Links retain the currently selected service, date and time without copying contact details or notes into URLs.

The farm list carries that return context into existing farms. Creating a farm from this flow opens its workspace; creating an animal group returns to the booking form with the group selected. Existing active/quarantined groups have a Use this group for appointment action. Other group statuses are not offered. Clients can return without choosing a group. Normal farm registration and observation recording keep their existing destinations.

Booking animal selectors now use the farmer-assigned group name (`housing_unit`) when present, with the internal code as fallback. Queries remain limited to the current owner's farms and eligible group statuses. Farm workspaces are keyed to account/farm identity, and late creation responses cannot navigate after unmounting. Existing backend ownership, species/service-category and current-availability checks remain authoritative. Adding farm records does not reserve or confirm an appointment.

Validation: 377 tests in 99 files passed. Typecheck and production build passed; lint has zero errors and nine existing warnings. Added tests cover farm/group creation followed by booking return, retained service/time context, readable group labels and owner/status query scopes. Existing farm creation/observation and booking regressions also passed. Chromium verified no-animal booking → farm registration → named group creation → booking return with that group selected at widths 1440/390/320, without overflow or runtime exceptions. Responses were intercepted fixtures; no production farms, groups or bookings were created. Session artifacts are under `/workspace/artifacts/1vet/farm-booking`.

Deploy the new main frontend commit to expose the changes. No database migration or environment publication is needed. Production hosting was not browser-verified. Payments remain unavailable.
