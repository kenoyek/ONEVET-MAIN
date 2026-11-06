import { createClient } from 'npm:@supabase/supabase-js@2.90.1';
import { paymentHandler } from '../_shared/payment-verification.ts';
const key = Deno.env.get('PAYSTACK_SECRET_KEY');
const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
Deno.serve(
  paymentHandler({
    configured: !!key && Deno.env.get('PAYMENTS_ENABLED') === 'true',
    authenticate: async (token) => {
      const { data, error } = await db.auth.getUser(token);
      return !error && data.user?.email
        ? { id: data.user.id, email: data.user.email }
        : null;
    },
    target: async (userId, kind, id) => {
      if (kind === 'subscription') {
        const { data, error } = await db
          .from('subscription_plans')
          .select('price,currency')
          .eq('id', id)
          .eq('is_active', true)
          .maybeSingle();
        if (error || !data) return null;
        return {
          amountKobo: Math.round(Number(data.price) * 100),
          currency: data.currency,
        };
      }
      const profile = await db
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (profile.error || !profile.data) return null;
      const order = await db
        .from('orders')
        .select('id')
        .eq('id', id)
        .eq('customer_id', profile.data.id)
        .maybeSingle();
      if (order.error || !order.data) return null;
      const items = await db
        .from('order_items')
        .select('quantity,product:marketplace_listings(price)')
        .eq('order_id', id);
      if (items.error || !items.data?.length) return null;
      const amountKobo = items.data.reduce((sum, item) => {
        const product = Array.isArray(item.product)
          ? item.product[0]
          : item.product;
        return (
          sum + Number(item.quantity) * Math.round(Number(product?.price) * 100)
        );
      }, 0);
      return { amountKobo, currency: 'NGN' };
    },
    verify: async (reference) => {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!response.ok) throw new Error('Payment provider unavailable');
      return await response.json();
    },
    settle: async (input) => {
      const { error } = await db.rpc('finalize_verified_payment', {
        p_user_id: input.userId,
        p_type: input.kind,
        p_target_id: input.targetId,
        p_reference: input.reference,
        p_amount_kobo: input.amountKobo,
        p_currency: input.currency,
      });
      if (error) throw new Error('Settlement rejected');
    },
  }),
);
