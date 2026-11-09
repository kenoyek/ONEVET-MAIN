# Provider team access

Owners can invite managers and booking coordinators without sharing an account. `/provider/invitations` lists invitations for the current verified email and the account's active workspaces. It is linked from the account menu, provider registration page and invitation alerts. Accepted members open the existing organization workspace with their permitted tools.

Managers can create/edit/publish services, set availability and manage booking requests. Booking coordinators can set availability and manage booking requests, with no private service editing or publishing. Owners retain business-profile edits, verification documents/applications and team administration. Membership grants no global professional/administrator role, individual licence approval or clinical-patient access. The owner calendar remains shared; inviting staff does not add parallel appointment capacity.

## Invitations and membership

An invitation binds a normalized email to an explicit supported role for seven days. The result shape is the same for existing and prospective accounts. Existing active accounts with a verified matching email can receive an in-app alert; no invitation email is sent. Prospective users can register, verify the invited email and open the same invitation page later.

Acceptance derives the actor from authentication and verifies the current `auth.users` email confirmation, organization and owner status. Wrong-account, expired, revoked and unsupported-role acceptance is rejected. Retrying an accepted invitation does not duplicate membership or restore suspended access. Owners can revoke pending invitations, change supported roles, suspend and restore members using reviewed row versions. Ownership cannot be transferred or removed through these controls. Role/access changes revoke stale pending invitations for the member's current email, preventing old invitations from recovering earlier permissions.

There can be at most 50 active members and 50 unexpired pending invitations per organization. The owner roster includes active members and recent inactive entries, up to 100, with profile names and original invited emails; it does not expose an account-directory/email lookup. Recipients see only their own invitations. Owner invitation creation explains that business details and booking contact information will be shared with the chosen member.

## Enforcement and booking operations

A capability helper derives access from the active membership, active member profile and active owner profile/membership. It is used only in the selected service/schedule/booking operations and RLS policies; owner-only verification and business mutations keep their existing checks. Direct client membership and invitation writes are revoked. Team lifecycle actions create trusted audit records.

Booking confirmations require an independent operator: a coordinator acting as a customer cannot confirm, decline or complete their own booking. Another authorized operator can respond. Team members can read authorized booking contact details and status history, while clinical-record and private verification-file permissions remain unchanged. Appointment details use scoped capabilities rather than assuming that only the stored calendar owner can operate a request. Missing capability checks do not enable provider controls.

Active managers/coordinators receive relevant in-app booking alerts, excluding the actor and duplicate recipients. Removing membership stops delegated reads/operations and future team alerts. Database mutation checks run after the organization lock; revocation therefore prevents a previously queued operation from committing. Workspaces recheck permissions periodically and on focus. Already viewed browser data cannot be retroactively erased; the database remains authoritative for subsequent requests.

## Deployment and validation

Migration `20261107020000_provider_team_access.sql` was applied and tracked on main before the environment interruption. After restoration, source hashes confirmed it was already applied; it was **not reapplied**. The interrupted UI work and final tests survived in the restored workspace. No environment publication was performed by this release, and no staging project was used. Payments remain disabled.

- Local SQL validation: 304 assertions, plus three real two-session races covering competing confirmations, original cancellation versus replacement confirmation, and membership revocation versus a queued coordinator confirmation. These ran in a disposable database without networking before the interruption.
- Main: 52 team assertions and all 91 existing booking/rescheduling/notification assertions passed in randomized rollback-only transactions. After restoration, the 52 team checks were repeated successfully; follow-up confirmed zero fixture users, helper functions, organizations or Storage metadata.
- Fresh restored-workspace validation: 171 frontend tests, strict TypeScript and production build pass. Lint has zero errors and nine existing fast-refresh warnings. Dependencies are unchanged.
- Local Chromium smoke test against the production build: synthetic invitation acceptance navigated to the coordinator workspace, booking tools loaded, owner/service/verification requests were absent, and no page exceptions occurred. Screenshots were inspected. API responses and authentication were local synthetic fixtures; this did not operate a live user account or validate live browser-to-Supabase traffic.

Run `bash scripts/test-core-security.sh` for SQL and all three concurrency races. `python scripts/verify-provider-team.py` previews the selected checks; `--main` runs the randomized rollback-only main tests with the configured Management API credential. Browser acceptance against a real authenticated deployed account remains untested.
