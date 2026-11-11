-- Monotonic row revisions preserve optimistic edits even within one transaction.
CREATE OR REPLACE FUNCTION public.touch_shop_product_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN NEW.updated_at:=greatest(clock_timestamp(),OLD.updated_at+interval '1 microsecond'); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.touch_shop_product_updated_at() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.touch_shop_product_updated_at();

-- Product publishing is an explicit, audited administrator action.
CREATE OR REPLACE FUNCTION public.shop_seller_eligible(seller_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM profiles p WHERE p.id=seller_uuid AND p.is_active AND (
   (p.verification_status='approved' AND has_role(p.user_id,'service_provider')) OR
   EXISTS(SELECT 1 FROM provider_organizations o WHERE o.created_by=p.user_id AND o.status='active' AND o.verification_status='approved')
 ));
$$;
REVOKE ALL ON FUNCTION public.shop_seller_eligible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shop_seller_eligible(uuid) TO anon,authenticated,service_role;

REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.marketplace_listings FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.marketplace_listings TO anon,authenticated;
DROP POLICY IF EXISTS "Sellers can manage own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Anyone can view approved listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Eligible shop products and authorized private reads" ON public.marketplace_listings;
CREATE POLICY "Eligible shop products and authorized private reads" ON public.marketplace_listings FOR SELECT
USING ((is_active AND is_approved AND shop_seller_eligible(seller_id)) OR seller_id=get_profile_id(auth.uid()) OR has_role(auth.uid(),'admin'));

CREATE OR REPLACE VIEW public.shop_catalogue WITH (security_barrier=true) AS
SELECT l.*, COALESCE(
 (SELECT o.name FROM provider_organizations o WHERE o.created_by=p.user_id AND o.status='active' AND o.verification_status='approved' ORDER BY o.created_at,o.id LIMIT 1),
 nullif(btrim(p.business_name),''), nullif(btrim(concat_ws(' ',p.first_name,p.last_name)),''), 'Marketplace seller')::text AS seller_name
FROM marketplace_listings l JOIN profiles p ON p.id=l.seller_id
WHERE l.is_active AND l.is_approved AND shop_seller_eligible(l.seller_id);
REVOKE ALL ON public.shop_catalogue FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.shop_catalogue TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.admin_shop_sellers()
RETURNS TABLE(id uuid,name text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT has_role(auth.uid(),'admin') OR NOT EXISTS(SELECT 1 FROM profiles WHERE user_id=auth.uid() AND is_active) THEN
  RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT p.id, COALESCE(
  (SELECT o.name FROM provider_organizations o WHERE o.created_by=p.user_id AND o.status='active' AND o.verification_status='approved' ORDER BY o.created_at,o.id LIMIT 1),
  nullif(btrim(p.business_name),''), nullif(btrim(concat_ws(' ',p.first_name,p.last_name)),''), 'Marketplace seller')::text
 FROM profiles p WHERE shop_seller_eligible(p.id) ORDER BY 2,p.id;
END $$;
REVOKE ALL ON FUNCTION public.admin_shop_sellers() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_shop_sellers() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.admin_save_shop_product(product_uuid uuid, details jsonb, expected_updated_at timestamptz DEFAULT NULL)
RETURNS TABLE(id uuid,updated_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE previous marketplace_listings%ROWTYPE; saved marketplace_listings%ROWTYPE;
 seller uuid; amount numeric; quantity numeric; image_list text[]; active boolean; approved boolean; is_new boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT has_role(auth.uid(),'admin') OR NOT EXISTS(SELECT 1 FROM profiles WHERE user_id=auth.uid() AND is_active) THEN
  RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501';
 END IF;
 -- Serialize saves against account suspension and administrator-role revocation.
 PERFORM 1 FROM profiles WHERE user_id=auth.uid() AND is_active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM user_roles WHERE user_id=auth.uid() AND role='admin' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Administrator access required' USING ERRCODE='42501'; END IF;
 IF product_uuid IS NULL OR jsonb_typeof(details) IS DISTINCT FROM 'object' OR
    EXISTS(SELECT 1 FROM jsonb_object_keys(details) k WHERE k NOT IN ('seller_id','title','description','category','price','stock_quantity','images','location','is_active','is_approved')) THEN
  RAISE EXCEPTION 'Invalid product fields' USING ERRCODE='22023';
 END IF;
 IF jsonb_typeof(details->'title') IS DISTINCT FROM 'string' OR jsonb_typeof(details->'seller_id') IS DISTINCT FROM 'string' OR
    coalesce(length(btrim(details->>'title')),0) NOT BETWEEN 2 AND 160 OR
    length(coalesce(details->>'description',''))>5000 OR length(coalesce(details->>'location',''))>160 OR
    coalesce(details->>'category','') NOT IN ('Pet Food','Pet Health','Pet Supplies','Livestock','Accessories') OR
    jsonb_typeof(details->'price') IS DISTINCT FROM 'number' OR jsonb_typeof(details->'stock_quantity') IS DISTINCT FROM 'number' OR
    jsonb_typeof(details->'is_active') IS DISTINCT FROM 'boolean' OR jsonb_typeof(details->'is_approved') IS DISTINCT FROM 'boolean' OR
    jsonb_typeof(details->'images') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Complete the required product details' USING ERRCODE='22023';
 END IF;
 seller:=(details->>'seller_id')::uuid; amount:=(details->>'price')::numeric; quantity:=(details->>'stock_quantity')::numeric;
 active:=(details->>'is_active')::boolean; approved:=(details->>'is_approved')::boolean;
 IF amount<0 OR amount>99999999.99 OR scale(amount)>2 OR quantity<0 OR quantity>2147483647 OR trunc(quantity)<>quantity OR
    jsonb_array_length(details->'images')>5 OR EXISTS(SELECT 1 FROM jsonb_array_elements(details->'images') image WHERE jsonb_typeof(image)<>'string' OR length(image#>>'{}')>2000 OR (image#>>'{}')!~'^https://[^[:space:]]+$') THEN
  RAISE EXCEPTION 'Invalid price, stock or image URLs' USING ERRCODE='22023';
 END IF;
 SELECT coalesce(array_agg(value),'{}') INTO image_list FROM jsonb_array_elements_text(details->'images');
 PERFORM pg_advisory_xact_lock(hashtextextended(product_uuid::text, 1111));
 SELECT * INTO previous FROM marketplace_listings l WHERE l.id=product_uuid FOR UPDATE;
 is_new:=NOT FOUND;
 IF NOT is_new AND expected_updated_at IS NULL THEN
  -- Retrying an identical create request returns its prior result, without another audit event.
  IF EXISTS(SELECT 1 FROM audit_logs a WHERE a.user_id=auth.uid() AND a.action='shop_product_created' AND a.entity_id::text=product_uuid::text)
   AND ROW(previous.seller_id,previous.title,coalesce(previous.description,''),previous.category,previous.price,previous.stock_quantity,previous.images,coalesce(previous.location,''),previous.is_active,previous.is_approved)
    IS NOT DISTINCT FROM ROW(seller,btrim(details->>'title'),coalesce(details->>'description',''),details->>'category',amount,quantity::integer,image_list,coalesce(details->>'location',''),active,approved) THEN
    RETURN QUERY SELECT previous.id,previous.updated_at; RETURN;
  END IF;
  RAISE EXCEPTION 'Product already exists; reload the catalogue' USING ERRCODE='40001';
 END IF;
 IF NOT is_new AND (expected_updated_at IS DISTINCT FROM previous.updated_at OR seller IS DISTINCT FROM previous.seller_id) THEN
  RAISE EXCEPTION 'Product changed or seller was reassigned; reload before saving' USING ERRCODE='40001';
 END IF;
 IF is_new AND expected_updated_at IS NOT NULL THEN RAISE EXCEPTION 'Product no longer exists' USING ERRCODE='40001'; END IF;
 -- A hidden record may still be withdrawn when its seller becomes ineligible.
 IF NOT EXISTS(SELECT 1 FROM profiles p WHERE p.id=seller) OR ((is_new OR (active AND approved)) AND NOT shop_seller_eligible(seller)) THEN
  RAISE EXCEPTION 'Choose an active approved business seller before publishing' USING ERRCODE='22023';
 END IF;
 IF is_new THEN
  INSERT INTO marketplace_listings(id,seller_id,title,description,category,price,stock_quantity,images,location,is_active,is_approved)
  VALUES(product_uuid,seller,btrim(details->>'title'),nullif(details->>'description',''),details->>'category',amount,quantity::integer,image_list,nullif(details->>'location',''),active,approved) RETURNING * INTO saved;
 ELSE
  UPDATE marketplace_listings l SET title=btrim(details->>'title'),description=nullif(details->>'description',''),category=details->>'category',price=amount,
    stock_quantity=quantity::integer,images=image_list,location=nullif(details->>'location',''),is_active=active,is_approved=approved
  WHERE l.id=product_uuid RETURNING * INTO saved;
 END IF;
 INSERT INTO audit_logs(user_id,action,entity_type,entity_id,details) VALUES(auth.uid(),CASE WHEN is_new THEN 'shop_product_created' ELSE 'shop_product_updated' END,'marketplace_product',saved.id,
  jsonb_build_object('seller_id',seller,'stock_quantity',saved.stock_quantity,'price',saved.price,'is_active',active,'is_approved',approved));
 RETURN QUERY SELECT saved.id,saved.updated_at;
END $$;
REVOKE ALL ON FUNCTION public.admin_save_shop_product(uuid,jsonb,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_save_shop_product(uuid,jsonb,timestamptz) TO authenticated,service_role;
