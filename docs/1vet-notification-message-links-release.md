# Appointment message notification links

19 November 2026

Message notifications now use the appointment conversation's canonical anchor, `#appointment-messages`. Older stored appointment links ending in `#messages` are normalized when displayed in the inbox or notification menu. Query parameters remain intact, and other allowed routes keep their existing anchors.

The appointment page also accepts the legacy anchor directly. After an authorized appointment finishes loading, it scrolls to and focuses the conversation wrapper. Existing sign-in return handling preserves that destination. Ordinary booking notifications still open the appointment without a conversation anchor, and existing internal-link restrictions remain in place.

## Verification

- Targeted notification, appointment and auth navigation tests passed (31 tests).
- Type checking, production build and lint passed; lint retains nine existing warnings and no errors.
- Local Chromium with synthetic, intercepted backend responses verified a real inbox link click, conversation focus, and a signed-out legacy link returning through sign-in with its hash preserved. Responsive checks passed at 1440, 390 and 320 pixels without horizontal overflow or uncaught browser exceptions.
- Full suite passed: 626 tests across 133 files.

No notification migration, backend deployment, live notification writes, email delivery, payment changes or environment publication is included.
