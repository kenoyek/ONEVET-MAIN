# Conversation refresh recovery

19 November 2026

Manual appointment conversation refresh now shows a pending state, prevents overlapping clicks and catches refresh failures. Participants receive a retry message while their draft and selected message page are retained. Successful refresh clears the error and announces completion.

Conversation and notification refreshes now propagate query failures to their existing callers. This also lets saved-message and saved-read-status flows use their existing accurate refresh-failure feedback rather than silently treating a failed reload as successful.

Validation: 21 conversation component and service tests passed, including manual refresh failure and recovery, repeated clicks, message retry, read-status feedback, pagination and account isolation. Type checking, lint and production build were checked separately. No backend changes or production message writes are included.
