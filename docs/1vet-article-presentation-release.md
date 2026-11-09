# Article presentation refresh — 9 November 2026

The resource cards previously displayed generic book placeholders, and the detail page rendered every content line as a paragraph. Both published poultry/pet guides now have custom editorial covers and Markdown bodies with section headings, selective bold emphasis, veterinary-attention callouts and a practical checklist.

The library shows complete card titles and uses two columns for a two-article collection. Detail pages add an introductory excerpt, reading time, quieter author metadata, spacious hero images and a 68-character reading column. Layouts support dark mode and wrapping tags on narrow phones. The editor explains supported Markdown syntax.

The Markdown renderer produces React elements, skips raw HTML and retains react-markdown's default safe URL transformation. Imported top-level content headings become h2 so each page retains a single title h1. Missing tags and view counts are handled safely.

Two generated illustrative images are stored as responsive WebP covers in the repository, with descriptive alternative text and a small illustrative caption. Cards use lazy loading; detail covers load eagerly. Managed images resolve on the current deployment, avoiding third-party hosting dependencies.

## Validation

- TypeScript and production build passed.
- Three focused tests passed for semantic Markdown rendering, plain paragraphs/title hierarchy and malicious HTML/URL handling.
- ESLint: zero errors; nine existing Fast Refresh warnings.
- Chromium production preview: resource library and both detail routes at 1440, 768, 390 and 320 px (12 views). All cover images loaded, one h1 per page, all expected detail sections/callouts rendered, no horizontal overflow or unhandled browser exceptions. Library search also passed.
- Dark screenshots captured for all three routes and visually inspected. Browser API calls used fixtures containing the exact publication payload; external font/payment requests were blocked. Screenshots and browser results are under `/workspace/artifacts/1vet/articles/`.
- The content publisher verifies actual main-database article body, cover URL, published status and date through the anonymous database role. The live website deployment itself is not fetched from this restricted environment.

No schema changes are required. `scripts/refresh-article-presentation.py --apply` updates exactly the two existing slugs atomically, guards against unexpected editorial changes and preserves publication dates and counters. The separate original publisher remains insert-only.
