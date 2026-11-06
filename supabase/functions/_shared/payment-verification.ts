export type PaymentKind = 'order' | 'subscription';
export interface PaymentDependencies {
  configured: boolean;
  authenticate: (
    token: string,
  ) => Promise<{ id: string; email: string } | null>;
  target: (
    userId: string,
    kind: PaymentKind,
    id: string,
  ) => Promise<{ amountKobo: number; currency: string } | null>;
  verify: (reference: string) => Promise<unknown>;
  settle: (input: {
    userId: string;
    kind: PaymentKind;
    targetId: string;
    reference: string;
    amountKobo: number;
    currency: string;
  }) => Promise<void>;
}
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function paymentHandler(deps: PaymentDependencies) {
  return async (req: Request): Promise<Response> => {
    const reply = (status: number, message: string) =>
      new Response(
        JSON.stringify(
          status < 300
            ? { status: 'success', message }
            : { status: 'error', error: message },
        ),
        { status, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (req.method !== 'POST') return reply(405, 'Method not allowed');
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer '))
      return reply(401, 'Sign in to verify payment');
    try {
      const user = await deps.authenticate(authorization.slice(7));
      if (!user) return reply(401, 'Sign in to verify payment');
      if (!deps.configured)
        return reply(503, 'Online payments are currently unavailable');
      let body: Record<string, unknown>;
      try {
        body = object(await req.json());
      } catch {
        return reply(400, 'Invalid request');
      }
      const { reference, type } = body;
      if (
        typeof reference !== 'string' ||
        !/^[A-Za-z0-9._=-]{6,200}$/.test(reference) ||
        (type !== 'order' && type !== 'subscription')
      )
        return reply(400, 'Invalid payment request');
      const targetId = type === 'order' ? body.order_id : body.plan_id;
      if (typeof targetId !== 'string' || !uuid.test(targetId))
        return reply(400, 'Invalid payment target');
      const target = await deps.target(user.id, type, targetId);
      if (!target) return reply(404, 'Payment target unavailable');
      const verified = object(await deps.verify(reference));
      const data = object(verified.data);
      const customer = object(data.customer);
      const metadata = object(data.metadata);
      if (
        verified.status !== true ||
        data.status !== 'success' ||
        data.reference !== reference
      )
        return reply(400, 'Payment has not been verified');
      if (
        data.currency !== 'NGN' ||
        target.currency !== 'NGN' ||
        !Number.isSafeInteger(data.amount) ||
        data.amount !== target.amountKobo ||
        target.amountKobo <= 0
      )
        return reply(400, 'Payment amount or currency does not match');
      if (
        typeof customer.email !== 'string' ||
        customer.email.toLowerCase().trim() !==
          user.email.toLowerCase().trim() ||
        metadata.user_id !== user.id ||
        metadata[type === 'order' ? 'order_id' : 'plan_id'] !== targetId
      )
        return reply(
          403,
          'Payment does not belong to this account and request',
        );
      await deps.settle({
        userId: user.id,
        kind: type,
        targetId,
        reference,
        amountKobo: target.amountKobo,
        currency: 'NGN',
      });
      return reply(200, 'Payment verified');
    } catch {
      return reply(
        502,
        'Payment could not be completed. Contact support with your payment reference before trying another payment.',
      );
    }
  };
}
