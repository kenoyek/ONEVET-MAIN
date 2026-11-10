# Browser article draft recovery — 10 November 2026

The article editor now backs up unsaved writing in the current browser. Backups are scoped by account profile and article ID (with a separate slot for new articles). The editor remounts when either account or article changes so previous writing cannot enter the next account's form.

Backups run after a 700 ms pause and flush on page hide, hidden-tab visibility changes, unload and editor unmount. A recovery banner offers Restore draft and Discard backup before editing resumes. Restoring brings back writing and image settings while retaining the article's current saved publication visibility. It never writes to Supabase or publishes an article.

Successful explicit site saves remove the backup and prevent pending timers/unmount cleanup from recreating it. Failed site saves retain the draft. Reverting all fields to their saved/default values also removes the backup. If storage is blocked, quota is exceeded or a backup is too large, the editor reports that browser backup is unavailable; explicit site saving remains enabled. An unload warning is requested when the final backup cannot be written.

Backup records are schema checked, limited to 500,000 serialized characters, and eligible for recovery for seven days from the last write. Malformed/expired records are removed when that editor is revisited. They are local browser data, not cloud synchronization or encrypted storage. There is one backup per account/article; multiple tabs editing the same article share that slot, with the latest write winning. Recovery may contain older writing than the current site version, so it requires an explicit review choice before save.

Validation:

- Twenty-eight targeted tests passed across browser backups, editor recovery, publication transitions, formatting and Markdown safety. Coverage includes incomplete drafts, account/article separation, malformed/expired/oversized backups, explicit restoration/discard, remount recovery, reverted changes, account switching, successful-save cleanup and blocked storage.
- TypeScript and production build passed. ESLint: no errors; nine existing Fast Refresh warnings.
- Chromium production preview with simulated authentication/API responses verified autosave across reload, the last edit immediately before reload, explicit restore/discard, preserved published visibility, Preview rendering and quota-error feedback. No article write requests or unhandled exceptions occurred.
- Recovery layouts checked at 1440, 390 and 320 px without horizontal overflow. Phone recovery screenshot visually inspected; artifacts at `/workspace/artifacts/1vet/draft-recovery/`.

Frontend-only release: no database migrations, live article changes or environment publication. Deploy main through the normal hosting workflow to activate browser recovery.
