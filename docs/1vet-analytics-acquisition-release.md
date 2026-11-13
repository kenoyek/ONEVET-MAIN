# Analytics acquisition tools — 13 November 2026

Admin → Analytics now includes a campaign link builder for approved public 1Vet destinations. Source, medium and campaign labels use the collector's accepted format, normalize to lowercase and replace spaces with underscores. Signup links retain their signup mode. Changing any input clears previously generated output, preventing accidental copying of an outdated campaign. The builder creates links locally; it does not send messages or publish campaigns.

Report period and country filters persist in the page URL, including on reload and browser navigation. Copy report link produces a canonical production URL containing only validated report filters. Existing administrator access rules still apply.

Campaign attribution uses the first campaign of a browser session. Test a new campaign in a fresh signed-out/incognito session. Tracking still requires the existing production Vercel collector configuration; this change does not activate collection or change the database. The live collection state could not be independently verified: the Supabase Management API returned HTTP 401. Use the dashboard collector check to confirm activation.

Validation: application and API typechecks, production build and lint (zero errors; nine existing warnings). Targeted coverage includes destination and label validation, signup query preservation, report filter bounds, link copying and clearing stale output. Local Chromium checks with intercepted synthetic backend responses passed filter restoration after reload, both copy actions, campaign generation, invalid-label feedback, and layout widths 1440, 390 and 320 pixels, with no runtime exceptions or production writes. These browser checks do not establish live deployment or data collection.

Browser screenshots: `/workspace/artifacts/1vet/analytics-campaigns/`.
