# Animal profile data and save feedback — 11 November 2026

Pet birth dates now use a date-only input rather than converting local calendar selections with `toISOString()`, which could shift the stored day in Lagos. Unknown dates can remain blank. Schema validation rejects malformed, impossible and future birth dates using the Africa/Lagos calendar day.

Weights are optional but must be finite and greater than zero when supplied. Decimal weights are preserved. Livestock counts must be positive whole numbers within the database integer range. The form no longer truncates fractions or silently replaces invalid entries with one. Switching livestock off resets its hidden count to the ordinary single-animal value. Validation errors are inline and entered values remain available for correction.

Profile updates, photo-reference updates and deletion now request a returned record and reject missing-row responses. Profile update failures retain the editor and show an inline error. A shared mutation lock prevents overlapping profile changes; form saves wait for photo processing. Existing backend ownership and permission rules remain authoritative. These frontend checks do not add database constraints or repair existing records.

Validation: 375 tests in 99 files passed; typecheck and production build passed. Lint has zero errors and nine existing warnings. New tests cover Lagos dates, leap dates, invalid weights/counts, exact date submission, retained fractional input, missing-row acknowledgements and repeated pending updates. Chromium ran in Africa/Lagos and verified future-date, negative-weight and fractional-count rejection, count reset when livestock is turned off, and exact persistence of a leap-day date and 0.025 kg weight at widths 1440/390/320 without overflow or runtime exceptions. Fixture responses were intercepted; no real animals were created or edited. Session artifacts are under `/workspace/artifacts/1vet/animal-profile-data`.

Deploy the new main frontend commit to expose the changes. No database migration or environment publication is needed. Production hosting was not browser-verified. Payments remain unavailable.
