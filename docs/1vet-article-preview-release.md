# Private article preview — 10 November 2026

Admins can switch between Write and Preview before saving a new or existing article. Preview uses the current React Hook Form values, including unsaved title, excerpt, tags, category, cover and Markdown body. It uses the same ArticleBody renderer, reading styles and ArticleImage component as public article pages.

Desktop and Mobile controls change the reading width; the narrow preview also uses phone title/body sizes and cover proportions on a desktop screen. Navigation, public view counts and publication dates are intentionally omitted from the private draft view. An empty preview explains how to start, and a failed or invalid cover URL produces a visible message that clears when the URL changes.

Preview controls are buttons that do not submit the form. Returning to Write retains draft values and the existing publication switch setting. Saving remains an explicit action in Write. Slug and cover image fields now have correctly associated labels; changing a previously failed sidebar cover URL remounts its thumbnail.

Validation:

- Five targeted tests passed: Markdown semantics/security and editor preview integration, including draft retention, empty placeholders and no form submission or article requests during preview.
- TypeScript and production build passed.
- ESLint: no errors; nine pre-existing Fast Refresh warnings.
- Chromium production preview with simulated admin/backend responses: new and existing article routes at 1440, 390 and 320 px, six views. Expected headings, bold text, callouts and covers rendered; one page h1; no horizontal overflow or unhandled exceptions. Mobile width toggle, return-to-write values, unchanged publication status, broken-cover feedback and replacement-image recovery passed. No article POST/PATCH requests or form submissions occurred.
- Dark screenshots captured and desktop/mobile screenshots visually inspected. Artifacts: `/workspace/artifacts/1vet/editor-preview/`.

This change modifies the frontend only. No live articles, Supabase data or environment configuration were published. The hosted website needs the normal deployment of the new main commit; browser validation used a local production build.
