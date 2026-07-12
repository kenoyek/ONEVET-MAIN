-- Update RLS for subscriptions
-- Users should NOT be able to insert/update their own subscription status directly.
-- They can only SELECT.

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only service role or admin can write to subscriptions.
-- By default, service role bypasses RLS, so we don't need a specific policy for it.

-- Update RLS for orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = customer_id)
    AND payment_status = 'pending'
);

-- Function to handle successful payment for a subscription
CREATE OR REPLACE FUNCTION public.handle_subscription_payment(
    p_user_id UUID,
    p_plan_id UUID,
    p_payment_reference TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public
AS $$
DECLARE
    v_duration_months INTEGER;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Get plan duration
    SELECT duration_months INTO v_duration_months
    FROM subscription_plans
    WHERE id = p_plan_id;

    IF v_duration_months IS NULL THEN
        RAISE EXCEPTION 'Invalid plan_id';
    END IF;

    v_expires_at := NOW() + (v_duration_months || ' months')::INTERVAL;

    INSERT INTO public.subscriptions (
        user_id,
        plan_id,
        status,
        starts_at,
        expires_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_plan_id,
        'active',
        NOW(),
        v_expires_at,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        plan_id = EXCLUDED.plan_id,
        status = 'active',
        starts_at = NOW(),
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();

    -- Log payment
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, 'subscription_payment_verified', 'subscription', (SELECT id FROM subscriptions WHERE user_id = p_user_id), jsonb_build_object('reference', p_payment_reference, 'plan_id', p_plan_id));
END;
$$;

-- Function to handle successful payment for an order
CREATE OR REPLACE FUNCTION public.handle_order_payment(
    p_order_id UUID,
    p_payment_reference TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.orders
    SET
        payment_status = 'paid',
        status = 'processing',
        payment_reference = p_payment_reference,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Update stock quantity for each item in the order
    -- Using a loop for simplicity, can be optimized with a single update if needed
    FOR item IN (SELECT product_id, quantity FROM order_items WHERE order_id = p_order_id) LOOP
        UPDATE marketplace_listings
        SET stock_quantity = stock_quantity - item.quantity
        WHERE id = item.product_id;
    END LOOP;

    -- Log payment
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES ((SELECT customer_id FROM profiles JOIN orders ON orders.customer_id = profiles.id WHERE orders.id = p_order_id),
            'order_payment_verified', 'order', p_order_id, jsonb_build_object('reference', p_payment_reference));
END;
$$;
