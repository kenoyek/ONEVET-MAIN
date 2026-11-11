# Farm record save recovery — 11 November 2026

Open farm, animal-group and owner-observation forms now keep one record UUID across failed-save retries. Synchronous action locks block repeated pending submissions. Group codes derive from that stable record ID, rather than changing on every attempt. Successful creation requires a returned record ID.

When a retry encounters an existing ID, the service reads the record using the original ID and its owner/farm/group/recorder scope. Identical saved fields recover the original result without inserting or overwriting another record. Changed fields produce an explicit conflict asking the client to review the saved record. Recovery failures preserve the original error; unrelated permission/network failures do not become success. Existing backend row policies remain authoritative.

Forms preserve entered details and retry IDs after failures. Closing a form or successfully saving starts a fresh draft next time. IDs are held in memory for the open form; this does not provide recovery across reloads, abandoned forms or different tabs. No database migration or ownership-policy change was made.

Validation: 384 tests in 101 files passed; typecheck and production build passed. Lint has zero errors and nine existing warnings. Added tests cover confirmed results, duplicate-key recovery, changed-field conflicts, all three recovery scopes, stable group codes, repeated form submissions and retained farm input/IDs. Chromium simulated lost farm and group responses, retried them, rejected a changed animal count without overwriting the original, recovered the matching group and returned to booking at widths 1440/390/320 without overflow or runtime exceptions. Responses and records were synthetic intercepted fixtures; no production farm records were created. Session artifacts are under `/workspace/artifacts/1vet/farm-retry`.

Deploy the new main frontend commit to expose the changes. No environment configuration was published. Production hosting was not browser-verified. Payments remain unavailable.
