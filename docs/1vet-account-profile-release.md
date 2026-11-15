# Account profile save reliability — 15 November 2026

Profile editing now requires the loaded profile to match the signed-in user. The editor is keyed by account identity, so switching accounts removes the previous draft and pending save feedback. Profile and avatar writes filter both profile ID and user ID and require an acknowledged returned row; a zero-row write can no longer report success.

A synchronous save lock prevents pending duplicate clicks. Inline validation/save errors retain entries. Dirty and saved notices distinguish the submitted snapshot from newer edits made during a pending request. If a confirmed write is followed by a profile-refresh failure, the notice describes the saved change separately from the refresh issue. Name/contact inputs are trimmed before saving; phone keeps the existing 7–15-digit check. Owner-facing labels no longer frame every account as a professional identity.

Pending results from an unmounted account do not refresh or display success for the next account. Existing license refresh behavior continues to preserve unsaved contact details. No database migration or permission expansion is included.

Validation covers zero-row writes, owner filters, repeated pending clicks, newer edits, account switching and existing license-upload tests. Application/API typechecks, lint and production build pass. Local Chromium uses a synthetic signed-in account and intercepted writes to verify dirty feedback, acknowledgement and widths 1440, 390 and 320 in both themes without production writes. Screenshots: /workspace/artifacts/1vet/account-profile/. These checks do not establish live profile updates or deployment.
