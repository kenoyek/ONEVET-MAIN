import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reference, type, plan_id, order_id } = await req.json()

    if (!reference) {
      throw new Error('Reference is required')
    }

    // 1. Verify payment with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      throw new Error(`Payment verification failed: ${paystackData.message || 'Unknown error'}`)
    }

    const amountPaid = paystackData.data.amount / 100 // Convert from kobo

    // 2. Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 3. Process based on type
    if (type === 'subscription') {
      if (!plan_id) throw new Error('plan_id is required for subscriptions')

      // Get user_id from token
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) throw new Error('No authorization header')
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      if (userError || !user) throw new Error('User not found')

      // Verify amount matches plan
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('price')
        .eq('id', plan_id)
        .single()

      if (planError || !plan) throw new Error('Invalid plan')
      if (amountPaid < plan.price) throw new Error('Insufficient payment amount')

      // Update database using helper function
      const { error: updateError } = await supabase.rpc('handle_subscription_payment', {
        p_user_id: user.id,
        p_plan_id: plan_id,
        p_payment_reference: reference
      })

      if (updateError) throw updateError

      return new Response(JSON.stringify({ status: 'success', message: 'Subscription activated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (type === 'order') {
      if (!order_id) throw new Error('order_id is required for orders')

      // Verify amount matches order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('total_amount, customer_id')
        .eq('id', order_id)
        .single()

      if (orderError || !order) throw new Error('Invalid order')
      if (amountPaid < order.total_amount) throw new Error('Insufficient payment amount')

      // Update database using helper function
      const { error: updateError } = await supabase.rpc('handle_order_payment', {
        p_order_id: order_id,
        p_payment_reference: reference
      })

      if (updateError) throw updateError

      return new Response(JSON.stringify({ status: 'success', message: 'Order processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } else {
      throw new Error('Invalid payment type')
    }

  } catch (error) {
    return new Response(JSON.stringify({ status: 'error', error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
