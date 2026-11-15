# Public service hub — 15 November 2026

The Services route now has a dedicated, lazily loaded page with veterinary, grooming, diagnostics and training links that carry recognized categories into the public directory. It reuses the homepage city finder and provides a three-step explanation of browsing, preparing animal details and waiting for provider confirmation.

Pet/farm onboarding links, pricing guidance, appointment requests and urgent-care guidance remain directly accessible. Copy distinguishes service listings from availability, requests from confirmed appointments, and base fees from additional costs. It does not claim that every category has providers in every city, and no online payment is collected.

Validation covers recognized category destinations, city-search handoff, confirmation/payment wording and urgent guidance, with the existing regression suite. Application/API typechecks, lint and production build pass. Local Chromium verifies the actual lazy-loaded route, category links, diagnostics handoff and no overflow at 1440, 390 and 320 in light/dark themes using intercepted synthetic backend responses without production writes. Screenshots: /workspace/artifacts/1vet/services-hub/. These checks do not establish live deployment or actual provider availability.
