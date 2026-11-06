# 1Vet platform audit

Date: 6 November 2026. Scope: repository at local HEAD, supplied onboarding strategy, local browser and automated checks. No production accounts, databases, payments or customer records were accessed. The PDF describes goals, not evidence of operating coverage.

## Stack and dependency map
React 18 / TypeScript / Vite 5 SPA, React Router, TanStack Query, Radix/shadcn, Tailwind, next-themes and Framer Motion. Supabase supplies Auth, Postgres/RLS, Storage and Realtime. Deno edge functions integrate Paystack and contact submissions. Vercel hosts the SPA; Docker builds a static nginx image. npm lockfile exists. CI uses Node 20; local image Node 24.22.1. Preserve this architecture.

## Feature inventory and verification
| Domain | Repository evidence | Verification / gap |
| --- | --- | --- |
| Identity | Auth context, signup, recovery, callback, role guards | Public auth renders; real registration, email and recovery require isolated test accounts |
| Roles | pet_owner, veterinarian, service_provider plus expanded provider roles and admin/super_admin | Frontend guards exist; multi-role parity and server permission tests outstanding |
| Public | Home, about, pricing, contact, articles, services, provider discovery/profile | Local frontend renders; original footer linked missing policies/careers/help pages |
| Customer | Dashboard, pets, profile, consultation list/chat, cart/orders | Components and queries exist; authenticated behavior unverified |
| Professional | Vet dashboard, SOAP notes, provider registration, organization configuration | Requires seeded approved/pending/suspended users and RLS tests |
| Admin | Users, verification queue, analytics, subscriptions, conversations, articles | No production admin access used; least privilege not established by route guards |
| Farm | livestockService, farms/batches/flock-health migration | Data model exists; no complete farmer portal route or booking target for batches |
| Scheduling | bookings, participants, history, reminders, slot-check RPC | Availability preflight is separate from insert: not atomic; no exclusion constraint in phase 5 |
| Consultation | ConsultationChat, Realtime messages, clinical services | Text flow present; audio/video vendor lifecycle not proven |
| Payments | Paystack frontend + verify-payment edge function + SQL helpers | Real transactions untested; ownership/reference binding needs urgent review |
| Records/storage | pets, clinical records, caregivers, licenses, public pet avatars | RLS policies in migrations; live schema and bucket policy state unverified |
| Notifications | in-app queries, Realtime, reminder tables, notification service | Durable worker delivery, retry and dead-letter handling not demonstrated |
| Content/SEO | article list/detail, SEO component, static metadata | Client-side metadata only; indexability needs production crawl/prerender evaluation |
| Testing | Vitest 23 files / 29 tests baseline | Mostly helper calculations/module checks, not end-to-end security evidence |

## Verified baseline
npm ci with integrity/TLS verification succeeds. Production build and 29 unit tests pass. Lint has 0 errors / 9 warnings. Chromium renders the public homepage. Separate strict tsc check fails with extensive existing errors (log /tmp/onevet-types.log in this instance); Vite build is not a type check. No application readiness claim for authenticated or remote workflows.

## Priority findings
### P0 — financial and authorization review before payment rollout
`supabase/functions/verify-payment/index.ts` authenticates subscriptions, but the order branch fetches any supplied order via service role without checking the caller owns it. Neither branch binds Paystack customer/reference/metadata to a server-created intent in this function. Amount uses a minimum comparison; currency and reusable reference behavior need review against SQL functions. A signed webhook pipeline is absent from the inspected functions. Do not deploy payment changes until authenticated, cross-owner, replay, currency and webhook tests pass on a disposable backend.

### P0 — authorization policies need live verification
Master migration has permissive INSERT policies for audit logs/notifications; avatar buckets allow broad authenticated uploads and public reads. Later hardening migrations must be compared to deployed policies. Review every policy including SECURITY DEFINER functions, execute grants, search_path, role escalation and clinical ownership. RLS source is not proof of production enforcement. Never use client filtering as a security boundary.

### P1 — booking reliability
`booking-service.ts` returns true when slot RPC fails (fail-open). Pricing comment says server-side but function executes in browser. Client preflight and insert race; ancillary writes ignore errors. Phase 5 history/participant/reminder policies shown are SELECT-only. Use an atomic server transaction for approved-provider validation, slot locks, authoritative fees, history and reminders. Keep migration rollout additive and inspect conflicts before adding exclusion constraints.

### P1 — account isolation
AuthProvider uses React Query and clears on explicit signout; auth-event transitions and background profile requests need cancellation/generation guards. Cart uses one localStorage key across users. Test direct account switches, delayed results, role refresh and revoked sessions before claiming cache isolation.

### P1 — schema drift
Dashboard queries `user_subscriptions` and orders.user_id while master migration defines subscriptions and customer_id. Generated types and many newer services disagree; strict TypeScript reports broad drift. Compare actual schema to migration chain on a disposable project; do not reset production or duplicate tables.

### P1 — trust and service availability
Original homepage hardcodes 500+ vets, 50k+ owners, around-the-clock availability, named testimonials and verification badges without supporting records. Strategy PDF lists targets, not achieved metrics. Remove unsupported claims. Existing marketing photography provenance is unknown: do not assert it depicts actual staff. Services must link to availability discovery without promising active coverage.

### P2 — UX, accessibility and performance
Fixed navbar overlaps provider marketplace header. No full mobile navigation in top navbar. Footer has dead routes/social anchors. Search placeholders lack persistent accessible names; backend errors look like empty results. Original sections have heavy gradients/animation and photographic payloads around 300–400KB each. Fonts depend on Google; use system fallback, later self-host licensed files. Focus visibility, reduced motion, keyboard menus, dark contrast and mobile overflow need checks. No WCAG or Core Web Vitals conformance claim without measurement.

## Screen review / design specification
Public home: prioritize consultation access with equal pet/farm entry points; replace fake statistics/reviews with steps and factual limits. Services: show discovery and conditional availability. Discovery/profile: visible filters, actual fees, verification only from status, loading/error/empty states. Auth: preserve provider, recovery and redirect behavior. Customer: useful zero-data animal/consultation actions; farmer UI pending. Vet: appointment-first clinical workspace; do not invent earnings or availability. Admin: verification/operations queue, restricted record access. Authenticated screens were statically inspected, not visually verified with real accounts.

Use forest primary #123C32, emerald secondary, warm ivory, semantic tokens and existing Plus Jakarta Sans/Inter fallbacks. 1200px content, 16/24px gutters, 8px spacing rhythm, 12–24px surfaces, restrained borders, 44px touch targets, visible focus and reduced-motion support. One primary action per section. Real errors must remain distinct from no data.

## Prioritized implementation plan
1. Foundation/public release: truthful home, shared navigation/footer, pet/farm information pages, emergency guidance, consultation discovery error handling, SEO defaults and accessibility. Implement locally without backend migration.
2. Customer release: typed schema reconciliation, account transition isolation, farmer/group portal and longitudinal records with object-level integration tests.
3. Consultation release: approved-provider enforcement, atomic slots/pricing, participant-scoped messaging, reviewed communications provider, payment intent/webhook ledger and delivery worker.
4. Professional/admin release: clinical authoring permissions, scheduling, reconciled earnings, audit/operations workflows and accessible dashboards.
5. Measured growth: production telemetry, resource editorial review, AI oversight and livestock intelligence behind approved flags.

## Decisions requiring business / professional review
Confirm operating cities, service hours/SLAs, veterinarian verification and renewal process, consultation prices/fees/tax/refunds, Paystack reconciliation and payout rules, communications vendor, emergency escalation/support contacts, image licenses, publication evidence for reviews/statistics, record retention/deletion/consent and Nigerian professional/data-protection requirements. Approve legal policies before publishing them. No compliance certification inferred.

## Dependency advisory scan
`npm audit --json` on 6 November 2026 reports 28 dependency entries: 2 critical, 18 high, 7 moderate, 1 low. Critical entries include Vitest/tinypool; direct high entries include Vite, react-router-dom, postcss and zod. These totals include transitive/development dependencies and are not a count of proven exploitable production endpoints. Dependency updates require a separate reviewed lockfile change and regression checks; no automatic `npm audit fix --force` was run. The current frontend change is not a dependency-security clearance.

## Remediations in this release
Unsupported public homepage and About statistics and sign-in social proof removed. Homepage no longer mounts invented testimonials. Broken footer routes/social anchors removed rather than inventing policies. Shared forest/ivory tokens, care information pages, urgent guidance, responsive navigation and discoverability improved. Discovery failure/retry and query submission states added. Booking slot-check errors now throw. Auth transitions clear query cache, clear roles/profile before accepting another identity, and ignore stale profile responses; tests cover a delayed previous-account response. Remaining cart scoping, role-source hardening, atomic bookings and backend authorization are still open.
