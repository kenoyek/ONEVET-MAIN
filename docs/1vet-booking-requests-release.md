# Provider availability and booking requests

Approved organizations can opt into requests, set one WAT opening window per weekday and mark up to 60 closed dates. Customers choose an owned pet or eligible farm group, a server-supplied time and a contact phone. Home visits require a private visit address. Providers confirm or decline pending requests; customers and providers can cancel with an explanation. Providers can mark confirmed appointments completed after their recorded end time. All online payments remain disabled.

The public provider page links to `/booking/new?service_id=…` only when requests are enabled. `/my-bookings` lists the customer's requests, with a dashboard link. Organization workspaces contain schedule settings and customer requests. Lists are paginated, refresh periodically, and show trusted status history on demand. In-app notifications are written transactionally; no email, SMS or automatic reminders are claimed.

## Calendar and request rules

- Times use `Africa/Lagos` explicitly, independent of browser/worker time zones. Slot starts follow a 15-minute grid inside the declared opening window, using the current service duration. The initial operational limits are 30 minutes' notice and a 90-day horizon; confirmation also requires that notice period.
- Pending requests do not reserve a slot. Confirmed appointments reserve an organization/owner calendar. GiST exclusion constraints prevent overlapping confirmed appointments for the organization, owner account (including its organizations), and customer. Organization row locks serialize schedule, service and confirmation changes; stale versions are rejected.
- Creation checks current published-service eligibility, opt-in availability, current service version, active customer status and animal ownership. The server derives the end time, NGN base fee and service/animal snapshots. Confirmation rechecks service terms, scheduling, credentials, customer status and animal ownership. Changed service terms require a new customer request; recorded fees are never silently rewritten.
- A customer can have at most five future pending requests per organization and twenty overall. Retrying an unchanged request with the same private request key returns its existing record. Reusing a key for different details fails.
- Farm groups are supported for veterinary/diagnostic services and must belong to the customer, with active/quarantined status. Grooming/training use pet profiles. Booking shares a minimal animal snapshot; it grants no access to customer clinical records.
- Changes to hours, pausing requests, unpublishing services or changing provider eligibility do not automatically cancel existing confirmations. Appointment lists recheck provider eligibility and warn when it is unavailable or unknown; customers should contact support before attending. New requests and confirmations fail closed when the provider or slot is unavailable.

## Privacy and deployment

New `provider_booking_settings`, `provider_booking_requests` and `provider_booking_events` tables have RLS and read-only client grants. Writes use trusted RPCs that derive the actor. Customers see their requests; active organization owners and active administrators can access authorized requests. Status actions check actor, transition and version; administrators can cancel for support but cannot impersonate provider confirmation. Contact details and customer visit addresses are private to participants/support. The clinic address is shared with the customer only on confirmation of a provider-location visit; home visits do not disclose it.

Booking mutations, history, audit events and recipient notifications commit together. No fake availability, fees, payments or clinical access are introduced. These requests use a separate table from the legacy booking schema; legacy rows and consultation flows are preserved, and are not migrated into the new owner calendar or customer list. Staff capacity, travel-time scheduling, overnight windows, automatic reminders and calendar integrations remain future work.

Migration `20261106090000_provider_booking_requests.sql` was applied and tracked on main `onevet-production`; authoritative TypeScript contracts were regenerated. Existing migration sources remain unchanged. No environment publication or staging project was used.

## Validation

- 205 local SQL assertions (161 previous plus 44 booking checks), followed by a real two-session race: one confirmation commits and the competing confirmation receives a slot conflict, leaving exactly one confirmed and one pending request. All run in a disposable container without networking.
- 44 randomized booking assertions on main inside a rollback-only transaction. Follow-up confirms no fixture users, helper functions, organizations or Storage metadata remain. No real customer rows are rewritten.
- 122 frontend tests, covering WAT midnight conversion, scope/actor boundaries, private home-visit addresses, version checks, request-key retries, changed-term acknowledgement, provider controls, request history, opt-in schedules and eligibility warnings.
- Strict TypeScript and production build pass. Lint has zero errors and nine existing fast-refresh warnings. Dependencies are unchanged.

Run `bash scripts/test-core-security.sh` for local SQL and concurrency checks. `python scripts/verify-provider-bookings.py` previews the assertion count; `--main` executes the rollback-only main checks with the configured Management API credential. The concurrency helper accepts only the disposable core-test container name, commits local synthetic fixtures, and never connects to main.

Validation covered PostgreSQL/Main Management API behavior and frontend component/service tests. An authenticated deployed-browser booking session and browser-to-PostgREST requests were not exercised in this environment.
