# Provider profile service discovery — 15 November 2026

Published provider profiles now offer local service search and category filters with a clear count, no-match state and reset. Filters reset when moving to a different provider. The page retains only currently eligible published catalogue data; private organization data is not requested.

Service metadata now distinguishes unknown fees/delivery/duration from a confirmed free service or clinic visit. A known zero price still displays zero. Service descriptions wrap within cards, registration-review wording remains limited to the organization, and the profile has descriptive metadata.

Availability toggles have service-specific accessible names and associated panel IDs. Public date checks now use the same real-date/window validation as booking entry. Existing on-demand loading, slot refresh, version reset and protected booking handoff remain.

Validation includes service search/category/reset, missing metadata, accessible availability controls, and the existing public slot-selection tests. Application/API typechecks, lint and production build pass. Local Chromium checks two synthetic services, search/reset, unknown-fee wording, availability selection, protected handoff parameters and no overflow at 1440, 390 and 320 in both themes with intercepted backend responses and no production writes. Screenshots: /workspace/artifacts/1vet/provider-services/. These checks do not establish live deployment or provider availability.
