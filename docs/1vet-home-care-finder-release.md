# Homepage care finder — 14 November 2026

Visitors can choose a care type and optional city on the homepage, then browse matching public care services without creating an account. The search uses validated internal directory links. The grooming service card now carries the grooming category into discovery.

The directory initializes category, city and optional provider/service search terms from bounded URL parameters, preserving incoming choices on reload and navigation between shared searches. Unsupported categories fall back to all services. The dedicated veterinarian directory always retains its veterinary filter. Local search submission still waits for the Search action, preserving existing behavior.

Validation includes homepage→directory filter handoff, input bounds, unsupported categories, veterinary-only protection and existing discovery/error states. Application/API typechecks, lint and production build are included. Local Chromium uses intercepted synthetic backend responses to check category/city handoff, reload and widths 1440, 390 and 320 without production writes.

Reference review remains blocked: the running network policy still permits only api.supabase.com, and all three approved reference domains returned proxy tunnel 403. Domain additions remain saved in the environment draft and require application through environment settings. No environment was published.
