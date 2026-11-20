# Article likes and comments

20 November 2026

Article detail pages now include a community section with public like and comment counts. Visitors can read comments and sign in to participate, returning directly to the discussion after authentication. Signed-in active accounts can like/unlike, post up to 1,000 characters and remove their own comments after confirmation. Administrators can remove comments from the same section.

Comments use plain text, display the author's profile name, and are paginated in groups of 20. Voter identities are never returned to readers. A short public-visibility notice precedes the composer. Account and article changes reset drafts. Failed submissions retain drafts and reuse the same comment identifier, so retrying an uncertain response does not duplicate a comment. Likes use an explicit desired state with a unique account/article key. Successful writes remain acknowledged if reloading counts fails.

## Database activation

Apply only `supabase/migrations/20261120010000_article_engagement.sql` to project `fxvctkfhitpgfyaztqor` using the Supabase migration workflow. Do not replay historical migrations. The database layer restricts writes to active authenticated profiles and published articles, enforces comment ownership/admin moderation, and limits accounts to five comments per minute. Direct table access is revoked; bounded public reads and controlled writes use dedicated RPC functions.

Activation is currently blocked: the available Supabase Management API credential returned HTTP 401. No production database changes were made. Until this migration is applied, the UI reports that likes and comments are unavailable and offers retry. Refresh Supabase access securely before enabling this on the live database.

## Validation

- Eight UI tests cover visitors, like state, overlapping clicks, lost responses, moderation confirmation, refresh failure, plain-text rendering, pagination and account changes.
- An isolated PostgreSQL runtime executed the migration and verified anonymous reads, private tables, authenticated writes, idempotent likes/comments, text bounds, rate limits, owner/admin removal, inactive accounts, pagination and unpublished article restrictions.
- Browser checks with intercepted synthetic responses verified liking, posting, confirmed removal, guest sign-in return and layouts at 1440, 390 and 320 pixels. No production writes occurred.
- Type checking, lint and production build passed; lint retains nine existing warnings and no errors. The full suite passed: 640 tests across 134 files.

To repeat isolated database checks without adding a project dependency:

```sh
npm install --prefix /tmp/onevet-article-sql-check --no-audit --no-fund --ignore-scripts @electric-sql/pglite
PGLITE_MODULE=file:///tmp/onevet-article-sql-check/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-article-engagement.mjs
```

The SQL check uses a fresh in-memory database with synthetic fixtures and never connects to a database server.
