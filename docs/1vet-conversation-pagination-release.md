# Appointment conversation navigation

19 November 2026

Participants browsing older appointment messages can now move one page toward newer messages, or jump directly to the latest page. Previously, the latest page was the only way back from historical messages.

Navigation retains the unsent draft. Repeated immediate clicks do not duplicate the same page cursor. Successfully sending a message resets navigation to the latest page, while existing account and booking boundaries continue to reset private component state.

Validation: 19 conversation UI and service tests passed, covering three-page navigation, repeated clicks, draft retention, read boundaries, retry handling and account isolation. Type checking and production build passed. Lint completed with nine existing warnings and no errors. No database migration or live message writes were needed.
