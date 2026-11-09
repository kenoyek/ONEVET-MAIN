# Appointment messaging — 9 November 2026

Customers and current authorized provider owners, managers and booking coordinators can open an appointment conversation from its private details page. Appointment notifications link directly to that thread. Existing clinical consultation chat remains separate.

Messages contain plain text, up to 2,000 characters. Author identity, role, timestamp and per-thread order come from the server. Direct client writes, edits and deletions are unavailable. Sender-scoped request keys make retries idempotent; limits are 10 messages per minute and 200 per day per account. The interface retains a failed draft and reuses its request key when retrying unchanged content.

## Access and lifecycle

Row policies restrict history to the active customer, current authorized organization team, and active support reviewers. Support observers cannot send as participants. Removed team members immediately lose access. Account and appointment changes isolate draft and query state. An access-check error hides cached thread content.

Sending requires active participants and an active owner membership, and is blocked for suspended organizations. Pending requests accept coordination until their start time; confirmed and completed appointments allow follow-up until 30 days after the recorded end. Cancelled, declined and expired threads remain read-only. This feature does not grant a veterinary license or access to clinical records.

Sending serializes with booking changes and team revocation on the organization lock. A queued message fails if revocation commits first. No external email or SMS is sent. New-message notifications contain a generic preview, without message content or contact details; audit metadata records the message identifier without its body.

Personal read cursors move forward only through a message from that same thread. The explicit read action uses the last visible message, rather than unseen messages arriving on another page, and reads only corresponding message notifications. Booking-status notifications stay independent. Reading an inbox alert alone does not acknowledge the conversation. Threads poll every 10 seconds while viewing the latest page, with manual refresh and older-page controls.

## Deployment and verification

Only `20261109010000_appointment_messaging.sql` was newly applied to the main project `fxvctkfhitpgfyaztqor`; previously tracked migration hashes were checked without replay. Generated TypeScript contracts were refreshed from that project. Payments remain unavailable.

- 183 frontend tests pass, including retry identity, access failures, account/resource isolation, visible-message acknowledgements, pagination and literal text rendering.
- Disposable PostgreSQL run: 346 SQL assertions and four concurrency races pass, including queued message denial after membership revocation.
- Main project: 42 messaging, 52 team, 44 booking, 27 rescheduling and 20 notification assertions pass (185 total). Each fixture transaction was rolled back; cleanup checks found no remaining fixture users, organizations, functions or objects.

Browser verification uses Chromium against the production build with intercepted synthetic APIs. It checks opening the private thread, sending once, refreshing saved content and rendering HTML as literal text. This is not an end-to-end test using real customer accounts.

Messages remain in appointment history; automatic retention expiry, attachments, editing, deletion, email and SMS delivery are not implemented.
