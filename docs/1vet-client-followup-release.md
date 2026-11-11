# Appointment navigation and dashboard follow-up — 11 November 2026

## Appointment discovery

Customer appointment views and pagination now live in URL parameters and survive reloads. Embedded provider lists use separate booking-prefixed parameters so they do not mix with customer filters. Changing a view resets pagination; invalid values fall back to Upcoming/page one. Pagination is bounded to 999 zero-based pages.

Appointment cards pass their return location into detail and message links. The details back link restores the customer list or registering organization workspace, including its view/page. Alternative-request links preserve this context. Return paths are restricted to appointment lists and organization workspaces. Query filters never replace existing customer/provider authorization scopes.

## Dashboard follow-up

The care dashboard now uses the same status guidance as appointment cards, so pending requests inside the missed confirmation window are not labelled as ordinary awaiting-confirmation records. It offers direct message/detail links and a Past requests needing follow-up shortcut. Existing per-account queries and independent panel retry behavior are retained; no new private data source was added.

Validation: 361 tests in 94 files passed. Typecheck and production build passed; lint has zero errors and nine existing warnings. Added/updated tests cover restored/shared filters, pagination reset, restricted return paths, provider parameter isolation, and dashboard status/follow-up links. Chromium checked the past-open view, detail/message return, reload persistence, focus navigation and dashboard shortcut at widths 1440/390/320 without overflow or runtime exceptions. Browser responses were intercepted fixtures; no production appointment or message was changed. Session artifacts are under `/workspace/artifacts/1vet/client-followup`.

Deploy the new main frontend commit to expose the changes. No database migration or environment publication is needed. Production hosting was not browser-verified. Payments remain unavailable.
