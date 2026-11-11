# Public appointment availability — 11 November 2026

Visitors can now expand Check available times on an eligible public provider service before signing in. Availability is fetched on demand through the existing anonymous-safe slot RPC, refreshes every minute while open, and uses Africa/Lagos (WAT). Empty dates, missing slots and failed checks have explicit guidance and retry controls. No private animal/contact data is exposed.

Choosing a time offers a booking link containing the service, date and selected start. Existing protected-route handling retains that query through sign-in. The request form initializes the shared date only if it is a real date within the current ninety-day booking window. The start remains subject to the form's current slot list, consent and existing server-side booking checks. The preview never submits a request, reserves a slot or collects payment.

Validation: 347 tests in 91 files passed; TypeScript and production build passed. Lint has zero errors and nine existing warnings. Added tests cover on-demand public lookup, selected-time links, changed/empty dates, no-slot responses, failed lookup retry and invalid shared dates. Chromium verified anonymous preview, sign-in return state and selected-time restoration in the authenticated request form at widths 1440/390/320 without overflow or runtime exceptions. Responses were intercepted fixtures; no real booking or account was created. Session screenshots are under `/workspace/artifacts/1vet/public-times`.

No database migration or environment publication is needed; the slot RPC already grants public read access. Deploy the new main frontend commit to expose the preview. Production hosting was not browser-verified. Payments remain unavailable.
