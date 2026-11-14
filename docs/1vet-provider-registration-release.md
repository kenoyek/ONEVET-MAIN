# Provider registration usability — 14 November 2026

New organization registration suggests its URL identifier from the organization name. Suggestions normalize accents, punctuation and whitespace to lowercase ASCII and hyphens, bound to the existing 80-character limit. Providers can override the suggestion; further name changes preserve that choice. Existing saved identifiers and business categories remain fixed when editing. Availability is still checked by the backend when saving, not implied by the suggestion.

Schema validation now marks affected inputs, provides associated inline feedback and focuses the first invalid control after fields are unlocked. Invalid data is never sent to the save service. An immediate submission lock complements the disabled controls, preventing repeated submissions before React updates the pending state. Failed writes retain entered data and existing retry messaging. Business phones use telephone inputs.

Organization approval, document review, booking eligibility and publication rules retain their existing behavior. No database change or live organization creation is required.

Validation includes identifier suggestions/manual overrides, error focus, retries, duplicate-submit protection and fixed fields when editing. Application/API typechecks, lint and production build pass. Local Chromium uses synthetic intercepted responses to verify validation, focus, identifier behavior and layouts at 1440, 390 and 320 pixels without production writes. These checks do not verify a live deployment or professional approval.
