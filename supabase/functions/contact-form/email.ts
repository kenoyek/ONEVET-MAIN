export type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function emailContactMessage(
  contact: ContactMessage,
  id: string,
  apiKey: string,
  from: string,
  send: typeof fetch = fetch,
) {
  const response = await send('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(5000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `contact-form/${id}`,
    },
    body: JSON.stringify({
      from,
      to: ['support@1vet.store'],
      reply_to: contact.email,
      subject: `[1Vet support] ${contact.subject.replace(/[\r\n]+/g, ' ')}`,
      text: `From: ${contact.name} <${contact.email}>\n\n${contact.message}`,
    }),
  });

  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
  const result = await response.json();
  if (typeof result?.id !== 'string' || !result.id) throw new Error('Email provider did not acknowledge the message');
}
