# Admin sign-in and route recovery — 9 November 2026

The supplied screenshot is the application-wide error boundary, rather than an admin permission/data error. A production-build browser reproduction produced the same screen by failing the admin page's JavaScript download immediately after sign-in. The previous React.lazy instance cached that rejection, so resetting the error boundary could not download it again; a full refresh was required. The screenshot alone does not supply the original production exception, so this release addresses the reproduced failure path and additional redirect problems found in the code review.

## Changes

- All lazy pages use bounded download recovery. A recognized JavaScript/CSS module-download error reloads the current URL once while keeping the existing sign-in. Suspense stays visible until navigation, avoiding a second invalid-module error.
- A session-storage marker is written before recovery. Another failure within two minutes shows manual recovery instead of creating a reload loop. Offline browsers and unavailable storage do not trigger automatic reloads. Ordinary programming and data errors are not classified as download failures.
- Persistent download errors explain the problem and offer a real refresh; the former retry action only reset React state against the same cached failed module. The error page no longer claims that an incident was reported automatically.
- Error boundaries reset when the route pathname changes, allowing a healthy page to open after another page crashes.
- Auth callbacks load with the application entry rather than as a separate lazy page, keeping recovery-token routing available before SDK URL cleanup and navigation to the password form.
- Database roles have deterministic priority: admin, then veterinarian, then the remaining account role. Sign-in, confirmation callbacks, protected-route redirects and desktop/mobile dashboard links share the same portal selector. Explicit authorized return destinations are preserved.
- Denied access at the account's own home route shows a clear access message rather than repeatedly redirecting to itself. Signed-in users can explicitly open the password-reset request screen.
- Vercel HTML/entry routes revalidate their cached responses; hashed assets keep the platform's existing cache behavior. Existing admin loading/error messages no longer advise users to replay a master migration.

No database roles, RLS policies, credentials, payment settings or backend data were changed.

## Verification

The full regression suite passed 267 tests. An additional authenticated-recovery navigation regression and the final focused route/auth suite pass after the final navigation refinements. Type checking, lint and the production build pass; lint retains the existing nine fast-refresh warnings and no errors.

Production-build Chromium tests use actual Supabase client sign-in with intercepted synthetic responses:

1. Before the fix, one failed admin module download reproduces the refresh-only global error screen.
2. After the fix, the same failure recovers automatically to `/admin` with one sign-in and the same session.
3. A persistent failure stops after one automatic reload and leaves a manual-recovery screen.
4. An owner-first multi-role administrator reaches `/admin` without a reload.
5. An owner-first multi-role veterinarian reaches `/vet-dashboard` without a reload.
6. The final build also passes the actual-client signup, protected-return and password-recovery browser regression.

Fixtures do not establish the original production stack trace or mutate real accounts. Deployment cache headers take effect through the normal Vercel deployment of the pushed commit; the environment configuration was not published.
