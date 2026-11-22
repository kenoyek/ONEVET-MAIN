import { describe, expect, it, vi } from 'vitest';
import { emailContactMessage } from '../../supabase/functions/contact-form/email';

const contact = {
  name: 'Ada Obi',
  email: 'ada@example.invalid',
  subject: 'Account\r\nhelp',
  message: 'Please help me update my account details.',
};

describe('contact email notification', () => {
  it('sends to the fixed support inbox and sets the submitter as reply-to', async () => {
    const sender = '1Vet Support <support@1vet.store>';
    const send = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: 'email-id' }));
    await emailContactMessage(contact, 'submission-id', 'test-key', sender, send);
    const [url, options] = send.mock.calls[0]!;
    expect(url).toBe('https://api.resend.com/emails');
    expect(options?.headers).toMatchObject({ 'Idempotency-Key': 'contact-form/submission-id' });
    expect(JSON.parse(options?.body as string)).toEqual({
      from: sender,
      to: ['support@1vet.store'],
      reply_to: contact.email,
      subject: '[1Vet support] Account help',
      text: 'From: Ada Obi <ada@example.invalid>\n\nPlease help me update my account details.',
    });
  });

  it('requires provider acknowledgement and rejects provider failures', async () => {
    const send = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({}, { status: 429 }))
      .mockResolvedValueOnce(Response.json({}));
    await expect(emailContactMessage(contact, 'id', 'test-key', 'sender', send)).rejects.toThrow('HTTP 429');
    await expect(emailContactMessage(contact, 'id', 'test-key', 'sender', send)).rejects.toThrow('did not acknowledge');
  });
});
