# Booking operations and rescheduling

Customers can request a different time for a future confirmed appointment. A reschedule creates a linked pending alternative: the original stays confirmed and keeps its recorded fee until the provider accepts the replacement. Declining or cancelling an alternative leaves the original intact. Cancelling or completing the original closes any pending alternative.

The provider's acceptance swaps the records in one transaction, including history, audit and recipient notification. The old appointment is closed and the replacement becomes confirmed. A slot conflict or changed original rolls back the whole decision, preserving the original confirmation. Only one pending alternative per original is allowed; unchanged retries reuse the request key. Providers cannot move an appointment without the customer's request.

## Customer and provider experience

Appointment lists offer Upcoming, Needs confirmation, Cancelled/declined/completed and All views, with server-side filtering and pagination. Upcoming requests show nearest appointments first. Expired pending requests remain available in All, with a passed-window explanation and disabled confirmation. Existing cancellation and decline controls remain available.

`/appointments/:id` provides participant-scoped request details, status history and links between original and alternative requests. New booking and rescheduling submissions open the resulting detail page. Organization owners can act as providers; administrators inspecting another account's appointment receive a read-only page. Database permissions remain authoritative.

The reschedule form shows both the original recorded fee and the current service's fee/duration. It copies the existing animal, contact and visit details rather than adding another personal-data entry flow. Both booking forms tie acknowledgement to the current service version, so a background refresh that changes service terms requires a new acknowledgement. No online payment is collected.

## Security and calendar rules

Public slot lookup continues to exclude all confirmed bookings. A separate authenticated reschedule lookup excludes only the caller's authorized original appointment, allowing a replacement that overlaps that appointment's existing window. Private creation/slot helpers are revoked from anonymous and authenticated callers. The customer-facing RPC checks the original customer, status, time and version as well as the existing animal ownership, provider eligibility, schedule and current service-version checks.

Confirmation rechecks the original's current version/status before the swap. The existing organization/owner/customer exclusion constraints still enforce calendar conflicts. Cancelling the original and confirming an alternative serialize on the organization lock, so a losing confirmation cannot resurrect either cancelled record. Changed pricing is stored only on the newly acknowledged alternative; the original's fee and historical snapshots remain unchanged.

Reschedules use the existing WAT schedule, 30-minute notice, 90-day horizon and pending-request limits. Alternatives must be accepted before the original start time. Original service eligibility and request opt-in must still permit new requests. This release does not introduce staff scheduling, payment collection, email/SMS delivery, automatic reminders or retroactive rescheduling.

## Deployment and validation

Migration `20261106100000_booking_rescheduling.sql` was applied and tracked on main `onevet-production`. It adds linked-request fields and reviewed helper/RPC definitions without modifying prior migration files. Authoritative main schema types were regenerated. No staging project or environment publication was used.

- 232 local SQL assertions: 205 prior assertions plus 27 rescheduling checks.
- Two local two-session races: competing confirmations produce one reservation; original cancellation invalidates a concurrent replacement confirmation and leaves both records cancelled. The test container has no network and is removed afterward.
- Main: 27 rescheduling assertions and all 44 existing booking assertions, using randomized rollback-only fixtures. Follow-up queries found no fixture users, helper functions, organizations or Storage metadata.
- 134 frontend tests, including nonce retries, fee acknowledgement after background refresh, scoped detail-page failures, reschedule links, read-only administrator views, filtering/page reset and expired confirmation controls.
- Strict TypeScript and production build pass. Lint has zero errors and nine existing fast-refresh warnings. Dependencies are unchanged.

Run `bash scripts/test-core-security.sh` for local SQL/race validation. `python scripts/verify-booking-rescheduling.py` previews the selected assertion count; `--main` runs randomized rollback-only checks with the configured Management API credential. Existing booking API regression checks use `scripts/verify-provider-bookings.py --main`.

Validation covered SQL behavior through PostgreSQL/Main Management API and frontend component/service tests. An authenticated deployed-browser rescheduling session and browser-to-PostgREST requests were not exercised in this environment.
