# Article publishing workflow — 10 November 2026

Publishing an existing saved draft previously left published_at empty, while the article list erased dates on unpublish and replaced them on republish. Editor and list actions now share a first-publication-date helper: never-published drafts retain null; first publication assigns a date; later edits, unpublish and republish preserve it.

The editor distinguishes saved Draft/Published status from unsaved changes. The save action explicitly says Save draft, Publish article, Save changes or Unpublish article. A synchronous request guard prevents repeated submissions; a disabled fieldset holds form values stable during saving. Mutation responses must return a single article ID before success/navigation. Failed saves unlock the editor and retain entered values for retry.

List publication actions similarly lock each row during its request and require a single returned record. The list updates the affected row from the response rather than performing an extra full fetch. Action buttons have article-specific accessible labels and a busy indicator.

Validation:

- Seventeen targeted tests passed across publication date transitions, editor save/preview behavior, formatting selections and Markdown rendering/security.
- Integration tests cover first publication of an existing draft, repeated submission while a request is pending, field locking, date preservation on unpublish and failed-save draft retention.
- TypeScript and production build passed. ESLint: no errors; nine existing Fast Refresh warnings.
- Chromium production preview with simulated API responses completed five write scenarios: publish an existing draft, unpublish from the list, republish from the list, edit a published article and save a new private draft. The original first-publication timestamp survived all later transitions; the private draft remained unpublished with a null publication date. No unhandled browser exceptions.

Changes apply to the frontend admin flows only; no database migration or retrospective date correction is included. Browser writes were intercepted and fulfilled with synthetic records. No real articles or environment settings were changed or published. Deploy main through the normal hosting workflow to activate the update.
