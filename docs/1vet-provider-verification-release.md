# Organization verification release

Owners can attach private registration documents and submit their saved organization details for administrator review. The owner workspace shows status, reviewer feedback, immutable evidence history, and returned applications that can be corrected and resubmitted. The Admin Center links to `/admin/verifications`, with paginated pending, returned, approved and suspended queues.

Administrators review the submitted business snapshot and document set, then start review, request information, reject, approve, or suspend an approved organization. Decisions require the expected application revision. Concurrent or stale decisions fail without overwriting another review. Feedback for returned, rejected or suspended applications must explain the decision to the owner. Administrators cannot review their own organizations, and inactive administrators cannot review or access documents through the reviewer permission.

## Security and evidence boundaries

- A private `provider-credentials` bucket accepts PDF, JPEG and PNG files up to 10 MB. Object paths use organization IDs and random filenames. Owners can upload only while their active owner membership and application status permit changes. Document links are signed for 60 seconds; files are never given public URLs.
- Client table writes are revoked. Evidence registration, submission and review use authenticated RPCs that derive the actor and verify permissions. Registration checks that the private object exists. Submission and review lock the organization, update case/status/history/audit records atomically, and preserve a snapshot of each revision's business details and evidence IDs.
- Uploaded evidence cannot be overwritten or deleted by clients. A new document of a given type supersedes its predecessor for the next submission, while earlier files remain in historical revisions. Failed metadata registration can be retried using the same uploaded path. Abandoned uploads remain private and need server-side maintenance; this release does not claim automatic cleanup or malware scanning.
- At least one current document is required to submit. Reviewers determine whether evidence is sufficient. Regulated categories also need professional-licence evidence for approval; veterinary clinic, independent-veterinarian and mobile-provider owners must already have individual veterinary approval. Expired evidence cannot be approved.
- Organization approval leaves organizations and locations inactive, grants no roles, and changes no personal licence verification. Public service publishing, invitations, scheduling and bookings remain gated. Payments remain disabled.

Historical events predating snapshot capture, if any, have null snapshots rather than fabricated details. New events capture the exact current case revision, with a unique organization/revision constraint. Owners and active reviewers can inspect the stored snapshot and associated historical files.

## Deployment and validation

Additive migrations `20261106060000_provider_verification_workflow.sql` and `20261106070000_verification_evidence_history.sql` were applied and tracked on main `onevet-production`. Applied migration sources remain immutable and the main TypeScript contracts were regenerated. No historical migration chain was replayed, and no environment publication was performed.

- 128 local PostgreSQL assertions: existing core/draft checks plus 45 verification checks in a disposable container with networking disabled.
- 45 main PostgreSQL verification assertions using randomized fixtures inside a rollback-only transaction. Follow-up queries confirmed no remaining fixture users, helper functions, organizations or Storage object records.
- 96 frontend tests, covering safe uploads, short-lived links, attachment retries without duplicate uploads, review locking, feedback, stale revisions, explicit approval confirmation and historical evidence selection.
- Strict TypeScript and production build pass. Lint has zero errors and nine existing fast-refresh warnings. Dependencies were unchanged.

Run `bash scripts/test-core-security.sh` locally. `python scripts/verify-provider-verification.py` previews the assertion count; `--main` runs the rollback-only main checks with the configured Management API credential. Test Storage rows are metadata-only fixtures with no uploaded payloads.

SQL access rules were tested through PostgreSQL and the main Management API; frontend interactions were tested with component/service tests. A deployed browser session and actual browser-to-Storage file upload/download were not exercised in this environment.
