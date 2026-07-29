import { supabase } from '@/integrations/supabase/client';

export interface InitiatePaymentInput {
  user_id: string;
  booking_id?: string;
  order_id?: string;
  amount: number;
  currency?: string;
  payment_gateway?: string;
  metadata?: Record<string, unknown>;
}

export interface HoldEscrowInput {
  booking_id?: string;
  order_id?: string;
  provider_id: string;
  held_amount: number;
  platform_fee?: number;
}

export const escrowService = {
  /**
   * Initiate a payment transaction record
   */
  async initiatePayment(input: InitiatePaymentInput) {
    const txnRef = `OV-TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        transaction_reference: txnRef,
        payment_gateway: input.payment_gateway || 'paystack',
        user_id: input.user_id,
        booking_id: input.booking_id || null,
        order_id: input.order_id || null,
        amount: input.amount,
        currency: input.currency || 'NGN',
        status: 'initiated',
        metadata: input.metadata || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Lock payment in escrow until service completion
   */
  async holdInEscrow(input: HoldEscrowInput) {
    const escrowRef = `OV-ESC-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const platformFee = input.platform_fee || Math.round(input.held_amount * 0.05 * 100) / 100;
    const netProviderAmount = Math.round((input.held_amount - platformFee) * 100) / 100;

    const { data, error } = await supabase
      .from('escrow_accounts')
      .insert({
        escrow_reference: escrowRef,
        booking_id: input.booking_id || null,
        order_id: input.order_id || null,
        provider_id: input.provider_id,
        held_amount: input.held_amount,
        platform_fee: platformFee,
        net_provider_amount: netProviderAmount,
        status: 'held',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Release escrow funds to provider upon booking completion
   */
  async releaseEscrow(escrowId: string, releasedByUserId: string, releaseReason = 'service_completed') {
    const { data: escrow, error: fetchErr } = await supabase
      .from('escrow_accounts')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (fetchErr || !escrow) throw new Error('Escrow account not found');
    if (escrow.status === 'released') throw new Error('Escrow funds have already been released');

    const releasedAt = new Date().toISOString();

    // 1. Update escrow status
    const { data: updatedEscrow, error: updateErr } = await supabase
      .from('escrow_accounts')
      .update({
        status: 'released',
        released_at: releasedAt,
      })
      .eq('id', escrow.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 2. Log release
    await supabase.from('escrow_releases').insert({
      escrow_id: escrow.id,
      released_by: releasedByUserId,
      amount_released: escrow.net_provider_amount,
      release_reason: releaseReason,
    });

    return updatedEscrow;
  },
};
