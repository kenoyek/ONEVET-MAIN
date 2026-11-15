# Reference-informed homepage refinement — 15 November 2026

Reference review is now complete for the public content and structure of all three requested pages:

- https://www.skeepy.co/ — separates free account features from plan benefits, explains the path to care and presents pet-owner/workspace benefits clearly.
- https://bluebloodvet.com/ — connects service discovery and a categorized shop, with clear routes for different animal needs.
- https://www.zero3petcare.com/plans.php — organizes plan inclusions and enrolment steps in a directly comparable structure.

The environment's approved domain grants are active. Plain HTTP-client requests initially received 403/406; normal browser request headers returned HTTP 200 for all three pages. Review used their actual public HTML content; this does not claim interactive testing of competitor signup/payment flows.

Applied to 1Vet: the marketplace moves earlier in the landing page; food, health, livestock and accessories cards link to recognized catalogue filters. The account section now includes a pet/farm feature selector and a clearly labelled workspace preview, with no fabricated account records. Account creation is distinguished from provider fees and confirmation. Existing pricing guidance and unavailable-payment/checkout notices remain. No competitor copy, prices, images, insurance coverage or testimonials were imported.

Validation covers preview switching, free-account/fee wording and recognized category destinations, plus existing landing/discovery coverage. Application/API typechecks, lint and production build pass. Local Chromium checks the selector, category links and no overflow at 1440, 390 and 320 in light/dark themes using intercepted synthetic backend responses, without production writes. Screenshots: /workspace/artifacts/1vet/reference-refinement/. This does not establish live deployment.
