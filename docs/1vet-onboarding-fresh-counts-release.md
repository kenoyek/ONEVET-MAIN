# Verify current setup counts before offering record creation

19 November 2026

The dashboard getting-started panel now waits for an in-progress record-count refresh before treating cached setup counts as verified. A cached empty pet count no longer briefly offers “Add your first pet” while a newer saved record is being checked. During verification, the link opens saved records. Once verified, the normal create or manage action returns.

The same verification rule applies to farm and organization progress. Contact details remain independently checked, and shopping and care browsing remain available.

Validation: all 11 client setup tests passed, including a deferred refresh with a cached empty pet count followed by an existing pet result. Existing failure recovery, mixed-owner setup, count metadata and contact validation checks also passed. No backend changes or production record writes were required.
