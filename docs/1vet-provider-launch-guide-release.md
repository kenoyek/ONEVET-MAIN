# Provider launch guide — 11 November 2026

Organization owners now see a focused setup guide in their private workspace, with direct links to saved business details, verification, public services and booking availability. The guide distinguishes an organization awaiting review from an approved organization and explains corrections after returned/rejected applications. Suspended organizations are not marked ready.

Public-listing completion comes from the eligibility-filtered public service catalogue, rather than an internal publish flag. Availability completion requires booking requests enabled and non-empty saved weekly hours. The existing account-scoped schedule query is shared with the booking manager. Service and verification actions invalidate the public-listing check, which also refreshes every 30 seconds. Loading and retry states explain unavailable checks. Configured hours do not promise open slots or automatic booking confirmation.

Pet stores and pharmacies receive a shop path directing them to contact the team about real products and stock, rather than a service-booking checklist. The guide is owner-only; existing delegated team controls are unchanged. Stable section anchors account for the fixed navigation bar.

Verification attachment and submission now share a synchronous action lock to prevent rapid repeated events from dispatching duplicate requests. Existing retry behavior reuses an uploaded document when metadata attachment fails.

Validation: 331 frontend tests in 87 files passed; TypeScript and production build passed. Lint has zero errors and nine existing Fast Refresh warnings. Added coverage includes truthful completion states, suspension, retry, retail paths and duplicate document submission. Chromium checked approved, submitted and shop-owner workspaces, navigation anchors and widths 1440/390/320 without overflow or runtime exceptions. These browser tests used intercepted synthetic responses and made no production writes. Screenshots are retained under `/workspace/artifacts/1vet/provider-launch-guide` for this session.

This is a frontend change; no database migration or environment publication is needed. Deploy the new main commit to expose the guide. The production hostname was not browser-verified. Payments remain unavailable.
