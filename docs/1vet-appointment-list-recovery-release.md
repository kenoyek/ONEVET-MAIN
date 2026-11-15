# Appointment-list recovery and clarity — 15 November 2026

Request views now explain their actual server filters and Africa/Lagos time display. An empty later page is distinguished from an empty view and offers Return to first page while preserving the selected customer/provider view. Loading failures expose an inline retry and preserve navigation state. Refresh controls reflect active requests, and Next is unavailable while a request has failed.

Cards are keyed by account identity and booking ID so cached navigation between participating accounts does not reuse another account's response draft. The view selector and card text also adapt to narrow layouts. Existing cancellation, confirmation, rescheduling, calendar and conversation controls remain.

Validation covers customer and provider-prefixed page recovery, error retry and retained view, plus existing request-management tests. Application/API typechecks, lint and production build pass. Local Chromium uses synthetic signed-in requests and intercepted backend responses to verify later-page recovery, view preservation, failed-load retry and no overflow at 1440, 390 and 320 without production writes. Screenshots: /workspace/artifacts/1vet/appointment-list/. These checks do not establish live deployment or change booking statuses.
