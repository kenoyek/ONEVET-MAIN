# Analytics report exploration — 14 November 2026

Admin → Analytics now provides independent search, sorting and ten-row pagination for each nonempty detail table, including regions and cities, pages, campaigns and referrers. Search ignores case and surrounding whitespace. Sort by views/sessions, browsers or alphabetical detail. Clear search restores the returned rows. Refreshing a smaller dataset clamps the current page, avoiding a misleading empty table.

Controls explicitly search returned report rows, which may be bounded by the existing backend aggregation limits. They do not claim to query all historical events. Period/country filtering and the complete report CSV retain their existing behavior; table searches do not alter dashboard totals or CSV output. There are no database or collection changes.

Validation covers pagination, search, clearing, browser-count ordering, refresh shrinkage and distinct missing-data versus no-match states. Release checks include the full unit suite, application/API typechecks, lint and production build. Local Chromium verification uses synthetic intercepted backend responses, checks search and pagination at desktop/mobile widths, and makes no production writes. This does not verify live collector activation.
