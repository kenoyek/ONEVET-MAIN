interface PreparationInput {
  status: string;
  start: string;
  end: string;
  delivery: string;
  eligibility?: 'eligible' | 'unavailable' | 'unknown';
}
/** Guidance follows recorded status; it never confirms, cancels or closes a request. */
export function bookingPreparation(input: PreparationInput, now = Date.now()) {
  if (!['pending', 'confirmed'].includes(input.status)) return null;
  if (input.eligibility !== 'eligible') return {
    title: 'Check provider approval before making plans',
    steps: ['Refresh this request to check the provider’s current approval.', 'If approval remains unavailable or cannot be checked, contact support before attending or arranging a home visit. This request has not been cancelled automatically.'],
  };
  if (Date.parse(input.end) < now) return {
    title: 'Follow up on this appointment',
    steps: ['The recorded appointment time has passed, but this request is still open.', 'Use appointment messages to clarify the outcome with the provider. The recorded status has not been changed automatically.'],
  };
  if (input.status === 'pending') return Date.parse(input.start) < now + 30 * 60_000 ? {
    title: 'Choose a new appointment time',
    steps: ['The confirmation window has passed. This request has not been confirmed or cancelled automatically.', 'Review appointment messages, cancel the old request with an explanation when appropriate, and choose a new time.'],
  } : {
    title: 'While you wait for confirmation',
    steps: ['Wait for the provider to confirm before travelling or arranging a home visit. A pending request does not reserve the time.', 'Use appointment messages to discuss your animal’s needs and agree any additional costs before care.'],
  };
  return {
    title: 'Prepare for your confirmed appointment',
    steps: [input.delivery === 'home_visit'
      ? 'Check your recorded visit address and contact phone. Use appointment messages to agree arrival details with the provider.'
      : input.delivery === 'clinic_visit'
        ? 'Check the recorded provider location and agree directions with the provider before travelling.'
        : 'Confirm how and where care will take place with the provider before making travel or home-visit arrangements.',
      'Keep relevant animal health records ready and agree any additional costs before care. No online payment has been collected.'],
  };
}
