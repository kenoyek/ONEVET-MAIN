BEGIN;
SET LOCAL lock_timeout='5s';
CREATE TABLE public.payment_receipts (
 reference text PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id),
 payment_type text NOT NULL CHECK(payment_type IN ('order','subscription')), target_id uuid NOT NULL,
 amount_kobo bigint NOT NULL CHECK(amount_kobo>0), currency text NOT NULL CHECK(currency='NGN'),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_receipts FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.payment_receipts TO service_role;

-- Serialize item additions with payment completion and derive prices from the catalogue.
CREATE FUNCTION public.protect_order_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target public.orders; product public.marketplace_listings;
BEGIN
 IF current_setting('role',true) NOT IN ('anon','authenticated') THEN RETURN NEW; END IF;
 SELECT o.* INTO target FROM orders o JOIN profiles p ON p.id=o.customer_id WHERE o.id=NEW.order_id AND p.user_id=auth.uid() FOR UPDATE OF o;
 IF target.id IS NULL OR target.payment_status<>'pending' OR target.status<>'pending' OR NEW.quantity<=0 THEN
  RAISE EXCEPTION 'Order is not editable' USING ERRCODE='42501'; END IF;
 SELECT * INTO product FROM marketplace_listings WHERE id=NEW.product_id AND is_active AND is_approved AND price>=0;
 IF product.id IS NULL THEN RAISE EXCEPTION 'Product unavailable' USING ERRCODE='42501'; END IF;
 NEW.unit_price:=product.price; NEW.total_price:=product.price*NEW.quantity; NEW.seller_id:=product.seller_id;
 RETURN NEW;
END; $$;
CREATE TRIGGER protect_order_item BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.protect_order_item();

CREATE FUNCTION public.finalize_verified_payment(p_user_id uuid,p_type text,p_target_id uuid,p_reference text,p_amount_kobo bigint,p_currency text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE previous payment_receipts; target public.orders; plan public.subscription_plans; expected numeric; item record;
BEGIN
 IF p_reference IS NULL OR length(p_reference) NOT BETWEEN 6 AND 200 OR p_currency<>'NGN' OR p_amount_kobo<=0 THEN RAISE EXCEPTION 'Invalid payment data'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_reference,0));
 SELECT * INTO previous FROM payment_receipts WHERE reference=p_reference;
 IF FOUND THEN
  IF ROW(previous.user_id,previous.payment_type,previous.target_id,previous.amount_kobo,previous.currency)
   IS DISTINCT FROM ROW(p_user_id,p_type,p_target_id,p_amount_kobo,p_currency) THEN RAISE EXCEPTION 'Payment reference already used'; END IF;
  RETURN 'already_processed';
 END IF;
 IF EXISTS(SELECT 1 FROM orders WHERE payment_reference=p_reference)
  OR EXISTS(SELECT 1 FROM audit_logs WHERE details->>'reference'=p_reference AND action IN ('order_payment_verified','subscription_payment_verified'))
  THEN RAISE EXCEPTION 'Legacy payment reference already used'; END IF;
 IF p_type='order' THEN
  SELECT * INTO target FROM orders WHERE id=p_target_id FOR UPDATE;
  IF target.id IS NULL OR NOT EXISTS(SELECT 1 FROM profiles WHERE id=target.customer_id AND user_id=p_user_id)
   OR target.payment_status<>'pending' OR target.status<>'pending' THEN RAISE EXCEPTION 'Order unavailable'; END IF;
  PERFORM l.id FROM marketplace_listings l JOIN order_items i ON i.product_id=l.id WHERE i.order_id=p_target_id ORDER BY l.id FOR UPDATE OF l;
  SELECT sum(i.quantity*l.price)*100 INTO expected FROM order_items i JOIN marketplace_listings l ON l.id=i.product_id WHERE i.order_id=p_target_id;
  IF expected IS NULL OR expected<>p_amount_kobo OR EXISTS(SELECT 1 FROM order_items i JOIN marketplace_listings l ON l.id=i.product_id WHERE i.order_id=p_target_id AND (i.quantity<=0 OR l.price<0 OR NOT l.is_active OR NOT l.is_approved))
   THEN RAISE EXCEPTION 'Payment amount or products do not match the order'; END IF;
  FOR item IN SELECT i.product_id,sum(i.quantity) AS quantity FROM order_items i WHERE i.order_id=p_target_id GROUP BY i.product_id LOOP
   UPDATE marketplace_listings SET stock_quantity=stock_quantity-item.quantity WHERE id=item.product_id AND stock_quantity>=item.quantity;
   IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
  END LOOP;
  UPDATE order_items i SET unit_price=l.price,total_price=i.quantity*l.price FROM marketplace_listings l WHERE i.order_id=p_target_id AND l.id=i.product_id;
  UPDATE orders SET total_amount=expected/100,payment_status='paid',payment_reference=p_reference,status='processing',updated_at=now() WHERE id=p_target_id;
 ELSIF p_type='subscription' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,1));
  SELECT * INTO plan FROM subscription_plans WHERE id=p_target_id AND is_active FOR SHARE;
  IF plan.id IS NULL OR plan.currency<>p_currency OR plan.price*100<>p_amount_kobo THEN RAISE EXCEPTION 'Payment amount does not match the plan'; END IF;
  PERFORM public.handle_subscription_payment(p_user_id,p_target_id,p_reference);
 ELSE RAISE EXCEPTION 'Invalid payment type'; END IF;
 INSERT INTO payment_receipts(reference,user_id,payment_type,target_id,amount_kobo,currency) VALUES(p_reference,p_user_id,p_type,p_target_id,p_amount_kobo,p_currency);
 IF p_type='order' THEN INSERT INTO audit_logs(user_id,action,entity_type,entity_id,details) VALUES(p_user_id,'order_payment_verified','order',p_target_id,jsonb_build_object('reference',p_reference)); END IF;
 RETURN 'processed';
END; $$;
REVOKE ALL ON FUNCTION public.finalize_verified_payment(uuid,text,uuid,text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_verified_payment(uuid,text,uuid,text,bigint,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
