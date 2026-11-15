# Farm workspace discovery — 15 November 2026

Farm owners can search name, city/state and production labels, filter production type, and sort by name or preserve the existing recently-added order. The toolbar reports matched/total farms, distinguishes no matches from no saved farms and provides reset actions. Searches remain local and reset with the existing owner-scoped workspace identity.

Farm links preserve the protected appointment return path while filtering and sorting. Successful standalone registration clears the list filters before showing the saved-farm guidance, so the new farm is visible. Existing stable-ID creation, retry recovery, ownership scope and farm rollout gate remain unchanged. Long farm names/location text wrap within cards.

Validation covers normalized location/type search, production filtering, non-mutating sort, no-match reset and booking return context, plus the existing farm/group/observation creation and retry suite. Application/API typechecks, lint and production build pass. Local Chromium checks production filtering, reset, sort, booking return links and no overflow at 1440, 390 and 320 in both themes using intercepted synthetic records without production writes. Screenshots: /workspace/artifacts/1vet/farm-discovery/. These checks do not establish live deployment or change record permissions.
