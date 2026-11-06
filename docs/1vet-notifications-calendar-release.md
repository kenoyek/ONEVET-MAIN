# Appointment alerts, inbox and calendar copies

The notification bell now opens a reliable recipient-scoped preview, and `/notifications` provides the previously missing full inbox. The inbox supports paginated all/unread views, individual acknowledgement, mark-all, refresh, loading/error states and WAT timestamps. Unread counts are fetched from the server after updates rather than decremented optimistically. Repeated read actions cannot make the count negative.

Notification queries and subscriptions are keyed by authenticated user. Switching accounts or logging out clears visible prior-account results immediately, and delayed responses/queued subscription callbacks do not populate the new account. Shared unread-count queries keep the preview, inbox and badges synchronized. Realtime invalidation is backed by 30-second polling while active and focus refresh.

New booking notifications contain a structured booking ID/version and link directly to `/appointments/:id`, including cancelled and rescheduled requests. Older notifications keep their existing text and data. Legacy links are restricted to recognized internal routes; external, encoded or unsafe destinations are not opened. Structured booking links take priority over stored link text. Appointment RLS remains the access boundary.

## Transactional alert rules

A trusted booking-event trigger emits one alert per recipient, booking and event version. New requests alert the provider. Status changes alert the other participant, and administrator support cancellation alerts both participants. The actor receives no redundant personal alert. Alerts include the appointment's WAT time, without animal names, phone numbers, addresses or clinical notes.

A reschedule has a distinct request/confirmation message. The original's internal replacement-cancellation event and a dependent alternative's automatic closure do not produce extra cancellation alerts: the associated replacement confirmation or original status alert explains the change. These internal history events receive explicit event kinds, rather than inferring intent from user-entered notes.

Clients cannot insert/delete notifications, dispatch the trigger, or alter booking context, title, message or destination. They retain only their recipient-scoped read access and `is_read` update privilege. Notification creation, status/history changes and audits commit or roll back together. A recipient/booking/version unique index prevents duplicates. Historical notifications were not backfilled or resent.

## Calendar downloads

Participants can download a one-time `.ics` copy of a currently confirmed, unexpired appointment. The control re-fetches authenticated appointment details and current provider eligibility before generating a file. Nonparticipants, cancelled/pending/completed appointments and unavailable/unknown provider eligibility are rejected. A pending response cannot initiate a download after logout, account switch, appointment change or unmount.

Files use stable appointment UIDs, UTC start/end instants, sequence/modified timestamps, CRLF line endings and RFC 5545 line folding. They contain a generic “1Vet appointment” title and an authenticated detail URL. Animal/service labels, contacts, addresses and clinical notes are omitted. No attendee/organizer invitation or alarm is added, and no connected calendar is modified.

The interface explains that copies do not update automatically: users must remove/replace earlier copies after cancellation or rescheduling and check 1Vet before attending. `CLASS:PRIVATE` is included, but privacy settings and import behavior ultimately depend on the calendar application.

## Deployment and validation

Migration `20261107010000_booking_notifications.sql` was applied and tracked on main `onevet-production`; authoritative TypeScript contracts were regenerated. Previous migration files remain unchanged. No historical customer alerts were rewritten, no staging project was used, and no environment publication was performed. Payments stay disabled. This release adds in-app alerts and local calendar downloads; it does not add email, SMS, push delivery or automatic reminders.

- 252 local SQL assertions, followed by both two-session confirmation/reschedule races in a disposable container without networking.
- Main: 20 notification assertions, all 44 booking assertions and all 27 reschedule assertions in randomized rollback-only transactions. Follow-up checks confirmed no fixture users, helper functions, organizations or Storage metadata remain.
- 155 frontend tests, including account/logout response isolation, read failures, safe navigation, inbox filters, calendar privacy/formatting, stale confirmation checks and export interruption on account/resource changes.
- Strict TypeScript and production build pass. Lint has zero errors and nine existing fast-refresh warnings. Dependencies are unchanged.

Run `bash scripts/test-core-security.sh` locally. `python scripts/verify-booking-notifications.py` previews the selected assertion count; `--main` runs randomized rollback-only checks using the configured Management API credential. Existing booking/reschedule regression commands remain available.

Validation covered PostgreSQL/Main Management API and component/service tests. An authenticated deployed-browser inbox session, browser-to-PostgREST/Realtime delivery and actual calendar-application import were not exercised in this environment.
