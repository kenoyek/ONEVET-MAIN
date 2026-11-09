# Sign-in, registration and recovery — 9 November 2026

Reviewed the customer and provider account flows, their mobile/desktop presentation, validation, recovery, and navigation after authentication.

## Fixes

- Recovery sessions now remain in the password-update journey. The auth context retains Supabase's `PASSWORD_RECOVERY` event through SDK URL cleanup and token refresh, and clears it on account changes or sign-out. The callback routes recovery to the new-password form before selecting a dashboard.
- Ordinary sign-in and confirmation callbacks wait for database roles before choosing a portal. Existing protected routes continue to enforce permissions. Requested internal care routes survive switching between sign-in and registration; malformed return paths and auth loops are rejected.
- Registration leaves a persistent email-confirmation acknowledgement and clears password inputs after a successful request. The acknowledgement does not claim verification, delivery or provider approval. Errors remain visible inline and preserve the user's entries.
- Each form serializes submissions, disables controls while pending and reports controlled network/rate-limit errors. Email inputs use appropriate mobile keyboard and capitalization settings. Password requirements are visible before submission, with labelled visibility controls and linked validation messages.
- Provider category cards use distinct radio values, support keyboard movement, and require an explicit selection. Business categories no longer share the same radio value. Category choice remains registration metadata, not a grant of clinical or provider permissions.
- Reset requests keep the existing allowlisted callback URL and use a generic acknowledgement. Unavailable links provide recovery actions. Password updates require a session, show confirmation, and wait for an explicit continuation instead of a timed redirect to the wrong portal.
- Auth modes are reflected in the URL. Quick-navigation tabs are hidden on account pages so they do not obscure the mobile forms. The existing premium forest/ivory presentation is preserved.

## Main configuration review

Main Supabase auth configuration was inspected read-only: email sign-up is enabled, email confirmation is required, the `1vet.store` and `www.1vet.store` callback URLs are allowlisted, and custom SMTP host/sender settings are configured. No auth settings or credentials were changed, and no real verification or reset email was sent.

Configuration presence does not prove delivery, reputation or inbox placement. A real-account confirmation and recovery-email delivery check remains an operational validation step.

## Verification

242 frontend tests pass, including 26 focused authentication checks covering confirmation, retained errors, password matching, duplicate submissions, explicit provider selection, recovery routing, account transitions and safe return paths. Type checking and the production build pass. Lint reports zero errors and the same nine existing fast-refresh warnings.

Browser checks use the actual Supabase JavaScript client against intercepted synthetic responses. They exercise failed sign-in, registration acknowledgement, successful sign-in back to a protected appointment, email recovery request, recovery-token callback, password update and continuation, provider radio keyboard selection, and mobile/desktop/dark layouts. This does not certify live credentials or real inbox delivery.

No schema migration, environment publication, payment activation or real account mutation is included.
