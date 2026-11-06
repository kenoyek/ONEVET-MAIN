import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  paymentHandler,
  type PaymentDependencies,
} from '../../supabase/functions/_shared/payment-verification';
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'fixture@example.invalid',
};
const id = 'a0000000-0000-4000-8000-000000000001';
let deps: PaymentDependencies;
const payload = () => ({
  status: true,
  data: {
    status: 'success',
    reference: 'fixture-reference',
    currency: 'NGN',
    amount: 1000,
    customer: { email: user.email },
    metadata: { user_id: user.id, order_id: id },
  },
});
const request = (
  body: unknown = {
    reference: 'fixture-reference',
    type: 'order',
    order_id: id,
  },
  auth = true,
) =>
  new Request('https://example.invalid/verify-payment', {
    method: 'POST',
    headers: auth ? { Authorization: 'Bearer fixture' } : {},
    body: JSON.stringify(body),
  });
beforeEach(() => {
  deps = {
    configured: true,
    authenticate: vi.fn(async () => user),
    target: vi.fn(async () => ({ amountKobo: 1000, currency: 'NGN' })),
    verify: vi.fn(async () => payload()),
    settle: vi.fn(async () => {}),
  };
});
describe('Payment verification boundary', () => {
  it('authenticates before looking up an order or contacting the provider', async () => {
    expect((await paymentHandler(deps)(request({}, false))).status).toBe(401);
    expect(deps.target).not.toHaveBeenCalled();
    expect(deps.verify).not.toHaveBeenCalled();
  });
  it('fails safely when Paystack is unconfigured', async () => {
    deps.configured = false;
    expect((await paymentHandler(deps)(request())).status).toBe(503);
    expect(deps.settle).not.toHaveBeenCalled();
  });
  it('does not query Paystack for an inaccessible order', async () => {
    deps.target = vi.fn(async () => null);
    expect((await paymentHandler(deps)(request())).status).toBe(404);
    expect(deps.verify).not.toHaveBeenCalled();
  });
  it.each(['amount', 'currency', 'payer', 'metadata', 'reference', 'status'])(
    'rejects mismatched %s without settlement',
    async (field) => {
      const p = payload();
      if (field === 'amount') p.data.amount = 1;
      if (field === 'currency') p.data.currency = 'USD';
      if (field === 'payer') p.data.customer.email = 'other@example.invalid';
      if (field === 'metadata') p.data.metadata.user_id = 'someone-else';
      if (field === 'reference') p.data.reference = 'different-reference';
      if (field === 'status') p.data.status = 'failed';
      deps.verify = vi.fn(async () => p);
      expect(
        (await paymentHandler(deps)(request())).status,
      ).toBeGreaterThanOrEqual(400);
      expect(deps.settle).not.toHaveBeenCalled();
    },
  );
  it('settles only the verified account, target, currency and amount', async () => {
    expect((await paymentHandler(deps)(request())).status).toBe(200);
    expect(deps.settle).toHaveBeenCalledExactlyOnceWith({
      userId: user.id,
      kind: 'order',
      targetId: id,
      reference: 'fixture-reference',
      amountKobo: 1000,
      currency: 'NGN',
    });
  });
  it('does not report success when transactional settlement fails', async () => {
    deps.settle = vi.fn(async () => {
      throw new Error('private internal detail');
    });
    const r = await paymentHandler(deps)(request());
    expect(r.status).toBe(502);
    expect(await r.text()).not.toContain('private internal detail');
  });
});
