# 1Vet interface specification — public foundation

Use the existing Tailwind/Radix components and semantic CSS variables. Forest primary (#123C32), emerald secondary, warm ivory background, white cards, charcoal text, muted slate; dark mode uses light mint foreground actions on dark forest. Do not use the mint background as text on white. Critical actions use text labels, not color alone.

Typography: existing Plus Jakarta Sans display and Inter body with system fallbacks. Body 16px, supporting text 14px, section eyebrow 12px, section headings 30–36px, responsive hero 48–72px. Retain readable line lengths and avoid uppercase paragraphs. External font availability is not required for layout.

Layout: max-width 1280px container including gutters; 16px mobile gutters, 24px tablet, 32px desktop. Use 8px spacing increments, 24–40px card padding, 16–24px card corners, restrained borders and soft shadows. Show one clear primary action. Avoid fabricated consultation interface previews, ratings, online status or verification.

Interaction: existing Radix Sheet supplies modal semantics, focus trapping, Escape dismissal and return focus. Forms require accessible names, visible labels where space permits, keyboard access, and errors distinct from zero results. Browser focus uses a 2px ring with 4px offset. Motion must respect reduced-motion; critical content does not animate into visibility.

Public hierarchy: consultation discovery first, pet/farm segmentation second, factual process explanation third, pricing/expectations and urgent-care guidance fourth, professional application last. Provider badges derive from actual approval status, not decorative artwork. Existing photography is reused as general imagery, never labeled as actual 1Vet staff; provenance needs business confirmation.

Customer/professional/admin follow-on: preserve existing functionality. Use a shared page heading, one primary task, clear waiting/loading/error/empty states, readable operational tables and visible financial state distinctions. Clinical/financial datasets must come from authorized records. No seeded success metrics in production UI.

Validation boundary: responsive browser snapshots and keyboard/menu checks are useful evidence but do not certify WCAG 2.2 AA. Full screen-reader, contrast, zoom, 320px/reflow and authenticated-portal testing remain release gates. Public performance targets require Lighthouse plus production p75 RUM; no scores or Core Web Vitals claims are made in this release.
