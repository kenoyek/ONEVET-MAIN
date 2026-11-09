# November 2026 resource articles

Published to the main 1Vet resource library on 9 November 2026 at the user's request; presentation refreshed at their subsequent request.

- Livestock / poultry: `/articles/poultry-morning-flock-check`
- Pet Health / dogs and cats: `/articles/pets-seven-day-enrichment-challenge`

`november-2026.json` is the publication payload. Markdown files are readable editorial copies, including titles; their remaining text matches the payload content. Markdown supports semantic headings, emphasis, lists and highlighted callouts. The renderer skips raw HTML and uses react-markdown's default safe URL handling. Articles carry a 1Vet educational attribution, with no invented clinical author, and distinguish routine care from signs requiring veterinary attention.

## Images

The two covers were created specifically for these articles using OpenAI image generation. They are illustrative scenes, not photographs documenting a real farm, household or clinical case. Article pages label them as illustrative images created for 1Vet. Descriptive alternative text identifies the scene.

Optimized WebP assets live in `public/images/articles/` at widths 1400 and 700 pixels. Smaller sources serve resource cards and mobile screens, while detail covers load eagerly. The app resolves managed image URLs against the current site, including preview and www, without requiring a third-party image host.

## Publishing

`python scripts/publish-november-articles.py` validates and previews the pair. `--apply` inserts only missing slugs without overwriting, then checks exact public content and publication state.

`python scripts/refresh-article-presentation.py` previews the presentation refresh. `--apply` changes only body and image URL for the two existing slugs, atomically, preserving publication dates, counters and attribution. Content hashes in `presentation-guards.json` identify the original approved plain-text bodies. The refresh refuses unexpected later editorial changes and is safe to retry once the new presentation is already applied.

Both tools use the configured Supabase management credential for onevet-production and verify content through the anonymous database role. No schema migration is needed.
