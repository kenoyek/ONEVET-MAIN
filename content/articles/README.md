# November 2026 resource articles

Published to the main 1Vet resource library on 9 November 2026 at the user's request.

- Livestock / poultry: `/articles/poultry-morning-flock-check`
- Pet Health / dogs and cats: `/articles/pets-seven-day-enrichment-challenge`

`november-2026.json` is the publication payload. The text files are readable editorial copies, including titles; their remaining text matches the payload content. Content is plain text because ArticleDetail renders newline-separated paragraphs. No invented clinical author, research statistics or treatment dosages are included. Articles carry a 1Vet educational attribution and distinguish routine care from signs requiring veterinary attention.

The publisher `python scripts/publish-november-articles.py` validates and previews the pair. `--apply` requires the configured Supabase access token, inserts only missing slugs without overwriting, then checks exact title, category, excerpt, tags and content plus publication date and status under the anonymous database role. Both articles passed that check. The production website itself was not fetched from this network-restricted environment.

Frontend validation: TypeScript and production build passed. ArticleDetail now displays a 1Vet byline and avatar fallback when no individual author is assigned.
