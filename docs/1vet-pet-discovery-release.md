# Pet profile discovery — 15 November 2026

The animal-profile list now exposes every supported species, including a dedicated Fish option instead of grouping fish under Other. Livestock profiles uses the saved is_livestock flag rather than inferring it from species. Species-specific choices remain available for cattle, horses and other farm animals regardless of that flag.

Local search trims whitespace, matches words across name/breed/species and stays out of the URL. Name sorting leaves the underlying cached order intact; Recently added preserves the original server order. Result counts, explicit no-match wording and Clear profile filters help recover a search. Filter drafts reset when the signed-in account changes. Existing backend/RLS access to profile records is unchanged.

Pet cards wrap long names and use an icon when a photo fails, while trying a new URL when the photo changes. Empty-profile copy distinguishes creating records from requesting veterinary care.

Validation covers fish/livestock classification, normalized search, non-mutating sorting, clear/account reset and photo failure/recovery, plus the existing regression suite. Application/API typechecks, lint and production build pass. Local Chromium checks real species controls, reset, alphabetical order, URL privacy and no overflow at 1440, 390 and 320 in both themes using intercepted synthetic profiles without production writes. Screenshots: /workspace/artifacts/1vet/pet-discovery/. These checks do not establish live deployment or change record permissions.
