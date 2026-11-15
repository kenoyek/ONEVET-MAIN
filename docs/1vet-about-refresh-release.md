# About-page refresh — 15 November 2026

The About page now matches the refreshed public-site visual direction: an editorial introduction, purpose statement, separate pet/farm/provider pathways, practical care principles, an Ibadan headquarters section and clear signup/marketplace/support actions. The HQ is Ibadan, Oyo State, matching the user's latest location instruction. No Port-Harcourt/Rivers references remain in application/public source.

Copy describes current record and request workflows, distinguishes provider confirmation and additional costs, and explains when in-person care is needed. No team biographies, achievements, coverage guarantees or fabricated testimonials were added. Provider registration links to the existing protected application flow; public discovery and marketplace browsing remain available.

Images reuse existing owned marketing assets, with responsive hero sources and lazy-loaded farm imagery. Styling is scoped to the About page and supports existing light/dark themes.

Validation includes application/API typechecks, lint, production build and the existing regression suite. Local Chromium checks one H1, HQ wording, pet/farm/provider/signup/shop/support destinations, hero-image loading and no overflow at 1440, 390 and 320 in both themes using intercepted synthetic backend responses. No production writes are made. Screenshots: /workspace/artifacts/1vet/about-refresh/. These checks do not establish a live deployment.
