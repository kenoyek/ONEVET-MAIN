# Detailed visitor analytics — 13 November 2026

The former admin Analytics page mixed profile counts with mock growth percentages, multiplied registration estimates and random charts. It is replaced by measured first-party traffic and actual database registration totals. No historical visitor data has been invented or backfilled.

## Reports

`/admin/analytics` provides Today/7/30/90-day periods, country filtering, one-minute refresh, last received event and current collector configuration/verification status. Reports use Africa/Lagos calendar boundaries and include:

- Page views, distinct browser IDs, sessions, browsers seen in the last five minutes, engaged sessions, estimated visible-page minutes, location coverage and actual account registrations.
- Daily traffic with zero-traffic dates, countries, country/region/city combinations and explicit Unknown buckets.
- Pages grouped without private record identifiers, referring domains, campaign source/medium/name, devices, browsers, operating systems and browser languages.
- First and last observed pages per session and distinct browsers reaching shop/cart/auth/booking page types. Page reach is not an ordered conversion funnel or a completed purchase.
- CSV download of summary metrics, account totals, daily traffic and all breakdowns, with spreadsheet-formula protection.

Distinct browsers are not verified people. Browser storage clearing, multiple devices, privacy controls and missed/blocked requests affect coverage. Visible time estimates use 30-second visible-page heartbeats; engaged sessions have at least two page views or two heartbeats plus a measured page. Sessions expire after thirty minutes of inactivity; browser IDs expire after ninety days. Account registrations are global profile counts, not geographically attributed visitor conversions.

## Collection and location

The first-party Vercel function `api/visit.ts` derives approximate country, region and city from Vercel's server-supplied headers. It never guesses geography from browser language and ignores client-supplied geography. City/region may identify a mobile gateway or VPN rather than a physical residence. No GPS or map coordinates are collected.

The tracker excludes admin activity, waits for signed-in roles to resolve, excludes admin/auth-callback/privacy paths and preview/localhost deployments, respects Do Not Track/Global Privacy Control and supports per-browser opt-out at `/privacy`. Query strings, tokens, full referrer URLs, private record IDs, raw IPs, full user agents and account identifiers are not stored in analytics. Campaign tags are limited to explicit safe UTM fields. Query-only navigation does not inflate page views. Visitor/session IDs are pseudonymous random browser identifiers.

The collector permits production first-party origins, removes obvious bots, validates event shapes, and uses a daily server HMAC only for short-lived rate limits. A dedicated server-only collector secret authorizes database ingestion; public API keys alone cannot submit events. Events have UUID deduplication. Raw events/configuration are not directly readable/writable by client roles; reports and key rotation require an active database administrator. Rotation is audited and guarded against duplicate pending clicks. Older events are purged during collection in bounded batches; reports never exceed ninety days. Rate-limit entries expire during ingestion after fifteen minutes.

## Applied database change

Only `20261111030000_site_analytics.sql` was applied and tracked on main `onevet-production`. All earlier tracked migrations were skipped. Post-deployment aggregate checks confirmed zero synthetic events, zero configured keys, no persistent test helpers, denied direct client event reads, denied anonymous reports and an available token-protected collector RPC. `scripts/verify-site-analytics.py --main` now checks deployed permissions without replaying the migration; before deployment it runs the rollback-only preflight.

## Activation in Vercel

1. Deploy the new main frontend/API commit. Open **Admin → Analytics → Generate collector key**, confirm, and copy the key directly from the admin page. It is shown only in that component session; no real collector secret is committed or pasted into chat.
2. In the existing Vercel project, add **SITE_ANALYTICS_KEY** to **Production** environment variables. Keep it server-only; never use a `VITE_` prefix. The collector uses the existing Supabase project/public key configuration and does not need a service-role credential.
3. Redeploy main. Ensure `VITE_ENABLE_ANALYTICS` is not `false` and Vercel exposes its production system variables. The report's health check verifies that the hosting key matches the database key.
4. Visit the production site in a signed-out/incognito browser with analytics allowed, then refresh the admin report. Administrator browsing is deliberately excluded. Collection starts after activation; past visits cannot be recovered.

Rotating a key invalidates the old one immediately. Update Vercel Production and redeploy after rotation. Hosting environment access was not available to this agent, so this final secret-entry/redeployment step remains with the project owner.

## Verification

401 frontend/server tests in 105 files passed, including the signed-in admin-role timing regression, country-header trust, absent geolocation, bot/privacy exclusions, session attribution/expiry, URL stripping, CSV output, key rotation and error/zero states. Typecheck covers both the frontend and Node API; production build passed. Lint has zero errors and nine existing Fast Refresh warnings.

The isolated PostgreSQL suite passed 451 SQL assertions plus five concurrency checks. The analytics preflight passed 28 counted checks in a rolled-back main transaction before deployment, with no test users remaining. Browser verification covered reports/filters/CSV, key-generation UI, failed and zero reports, normalized production-origin tracking, query-only navigation, visible heartbeats, session expiry, opt-out and admin exclusion at 1440/390/320 pixels without overflow or runtime exceptions. All browser network responses and key rotations were synthetic intercepted fixtures; no production analytics events or test secrets were created. Session screenshots are under `/workspace/artifacts/1vet/visitor-analytics`.

Live production collection/physical location accuracy cannot be established by these fixtures; confirm the first real visits after Vercel activation. No cloud environment configuration was published. Payments remain unavailable.
