# Article formatting controls — 10 November 2026

The admin article editor now offers labelled controls for section headings, bold emphasis, bullet lists and callouts. Authors can select text and apply formatting, continue typing in the content field, and check the result in the existing private Preview tab. Markdown remains editable directly.

Inline emphasis preserves surrounding text and restores the selection for replacement or toggling off. Block actions expand to complete selected lines, avoid including the next line when a selection ends at a newline, replace an existing block prefix rather than stacking it, and toggle off when every selected line already uses that format. Empty input receives a usable heading prefix or selected emphasis placeholder.

Toolbar actions are explicit non-submit buttons. The controlled textarea retains React Hook Form's ref, value, change/blur events and accessibility attributes. The toolbar wraps on narrow screens.

Validation:

- Ten targeted tests passed across selection transformations, editor/preview integration and Markdown safety. A new integration case formats selected text, verifies semantic bold in preview and confirms no submission or article requests.
- TypeScript and production build passed. ESLint passed with nine pre-existing Fast Refresh warnings and no errors.
- Chromium production preview with simulated admin/API responses verified bold removal/restoration with cursor selection, draft retention, unchanged publication visibility, preview rendering and zero article writes on new and existing article routes. Layouts checked at 1440, 390 and 320 px; writing toolbar separately checked at 1440 and 320 px. No overflow or unhandled exceptions.
- Browser screenshots: `/workspace/artifacts/1vet/editor-preview/`, including `toolbar-1440.png` and `toolbar-320.png`.

Frontend-only change. No articles, database settings or environment configuration were published. The website needs the normal deployment of main before these controls appear live.
