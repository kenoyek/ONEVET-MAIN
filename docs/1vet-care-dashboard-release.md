# Customer care dashboard — 9 November 2026

The customer dashboard now brings upcoming appointments, vaccination dates recorded by the owner, and recent pet journal observations into a single care overview. Each preview links to the full private appointment or pet journal. Existing consultations, pet cards, preferences, memberships and order sections remain available.

Upcoming appointments include pending and confirmed customer requests whose recorded end has not passed, ordered by start time. Pending requests explicitly require provider confirmation. The preview displays times in Africa/Lagos with a WAT label, shows up to four requests and links to the full appointment list. It does not reserve slots or collect payment.

Vaccination dates include non-corrected owner-reported vaccination entries with a supplied due date no later than 30 calendar days after today in Lagos, including past dates. Four dates are shown oldest first, with an explicit indication when more exist. These are dates supplied by the owner, not a verified vaccine schedule or a claim that a pet is overdue. An empty result does not establish vaccination status. No reminder delivery or background notification worker is introduced.

Recent journal observations show up to four non-corrected entries ordered by observation date, creation time and identifier. Summaries include the pet name, owner-reported title, date and weight where applicable. Full note bodies, contact details and visit addresses are not fetched for the care overview. The full journal retains corrections and historical content.

## Access and reliability

Data requests wait for a matching active profile and authenticated account. Each query key includes both identifiers. Account and profile changes remount the care overview, isolating delayed responses. Journal selectors join current pet ownership; existing main-project row policies enforce access independently of client filtering. No new administrator, provider-team or clinical permissions are added.

The three panels load and fail independently. A background error hides that panel's cached rows and provides a targeted retry; other successful sections remain available. Panels refresh on a 60-second interval and can be refreshed manually. Previews use one lookahead row and never advertise limited results as account-wide totals.

Saving or correcting a pet journal entry invalidates the current account's dashboard summary. Journal links include a stable anchor, and the journal scrolls into view after asynchronous access loading, with space for the fixed navigation bar.

## Validation

- 219 frontend tests pass, including independent failure/recovery, account isolation, profile mismatches, inactive profiles, stale-content hiding, calendar boundaries, query projections and preview limits. The affected journal suite also passes after deep-link and cache invalidation changes.
- Type checking and production build pass. Lint has zero errors and the same nine existing fast-refresh warnings.
- Disposable PostgreSQL: 388 SQL assertions and five concurrency races pass, including six new dashboard selector checks.
- Main project: 42 randomized checks pass (36 journal boundary checks plus six dashboard checks). The fixture transaction was rolled back, and follow-up cleanup checks found no fixture users, functions, organizations or storage objects.

Chromium checks the production build with intercepted synthetic APIs: care previews, record links, literal rendering of stored titles, partial background failure and recovery, and a 390-pixel mobile viewport without horizontal overflow. This does not establish real-account end-to-end behavior.

No database migration, persistent production data change, environment publication, payment activation, email or SMS delivery is part of this phase.
