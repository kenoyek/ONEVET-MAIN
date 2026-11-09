# Welcome page refinement — 9 November 2026

The public welcome page now uses a warmer ivory and forest-green palette, editorial serif accents, a more deliberate type hierarchy and an arched veterinary-care photograph. A prominent veterinarian action and a care-options shortcut lead into distinct pet and farm pathways. Photography, consistent card spacing and a simpler three-step explanation carry the same visual direction through the page.

The FAQ, urgent-care guidance and provider application remain easy to reach. Copy describes actual care journeys without introducing reviews, statistics, credential badges or promises of immediate availability. Existing routes, account workflows and payment settings are unchanged.

## Performance and interaction

- The hero uses locally served responsive WebP sources: approximately 72 KB at 1100 pixels and 34 KB at 640 pixels, compared with the previous 304 KB JPEG. Browser image selection is controlled with `srcset` and `sizes`.
- Below-fold pathway images use lazy-loaded WebP files. Images retain explicit dimensions, and the hero has high fetch priority.
- Styles are scoped to the welcome page, including dark-mode variables; private workspaces keep their existing presentation.
- Buttons have visible keyboard focus, FAQ controls retain Radix keyboard behavior, and the care-options anchor leaves room for the fixed navigation.
- Hover effects respect reduced-motion settings. The layout reflows from two columns to one on phones, with no new animation or dependency.

## Validation

219 frontend tests pass, including the existing pet/farm navigation and public-care safeguards. Type checking and production build pass. Lint has zero errors and the same nine existing fast-refresh warnings.

Chromium checks the built page at 1440, 768, 390 and 320 pixels, including image loading, care routes, the fixed-header anchor, keyboard FAQ activation, dark mode and reduced motion. Local browser checks intercept APIs and do not use real customer data. These are targeted checks, not a Lighthouse score or accessibility certification.

No database, payment or environment configuration deployment is included.
