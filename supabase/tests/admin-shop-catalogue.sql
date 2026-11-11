CREATE FUNCTION public.shop_test_assert(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',label; END IF; RAISE NOTICE 'PASS: %',label; END $$;
CREATE FUNCTION public.shop_test_denied(statement text,expected_code text,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 BEGIN EXECUTE statement; EXCEPTION WHEN OTHERS THEN IF SQLSTATE=expected_code THEN RAISE NOTICE 'PASS: %',label; RETURN; END IF; RAISE; END;
 RAISE EXCEPTION 'FAIL: expected denial: %',label;
END $$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('ed111111-1111-4111-8111-111111111111','shop-admin@example.invalid','{}'),
 ('ed222222-2222-4222-8222-222222222222','shop-seller@example.invalid','{"role":"service_provider","business_name":"Fixture Store"}'),
 ('ed333333-3333-4333-8333-333333333333','shop-buyer@example.invalid','{}');
INSERT INTO user_roles(user_id,role) VALUES('ed111111-1111-4111-8111-111111111111','admin');
UPDATE profiles SET verification_status='approved' WHERE user_id='ed222222-2222-4222-8222-222222222222';
SELECT shop_test_assert(NOT has_table_privilege('authenticated','public.marketplace_listings','INSERT,UPDATE,DELETE,TRUNCATE'),'direct catalogue mutation privileges revoked');
SET LOCAL ROLE anon;
SELECT shop_test_denied($q$ SELECT admin_shop_sellers() $q$,'42501','anonymous cannot list seller accounts');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ed222222-2222-4222-8222-222222222222',true);
SELECT shop_test_denied($q$ INSERT INTO marketplace_listings(seller_id,title,category,price,is_approved) VALUES(get_profile_id(auth.uid()),'Forged','Pet Food',1,true) $q$,'42501','seller cannot self-publish by direct write');
SELECT shop_test_denied($q$ SELECT admin_shop_sellers() $q$,'42501','seller cannot access admin RPC');
SELECT set_config('request.jwt.claim.sub','ed111111-1111-4111-8111-111111111111',true);
SELECT shop_test_assert(EXISTS(SELECT 1 FROM admin_shop_sellers() WHERE name='Fixture Store'),'admin can select eligible seller');
SELECT admin_save_shop_product('ed444444-4444-4444-8444-444444444444',jsonb_build_object('seller_id',get_profile_id('ed222222-2222-4222-8222-222222222222'),'title','Fixture feed','description','Real catalogue test fixture','category','Pet Food','price',1250.50,'stock_quantity',3,'images','[]'::jsonb,'location','Lagos','is_active',false,'is_approved',false));
SELECT shop_test_assert(NOT EXISTS(SELECT 1 FROM shop_catalogue WHERE id='ed444444-4444-4444-8444-444444444444'),'draft absent from public catalogue');
SELECT admin_save_shop_product('ed444444-4444-4444-8444-444444444444',jsonb_build_object('seller_id',get_profile_id('ed222222-2222-4222-8222-222222222222'),'title','Fixture feed','description','Real catalogue test fixture','category','Pet Food','price',1250.50,'stock_quantity',3,'images','[]'::jsonb,'location','Lagos','is_active',false,'is_approved',false));
SELECT shop_test_assert((SELECT count(*)=1 FROM audit_logs WHERE action='shop_product_created' AND entity_id='ed444444-4444-4444-8444-444444444444'),'identical creation retry adds no duplicate audit');
SELECT admin_save_shop_product('ed444444-4444-4444-8444-444444444444',jsonb_build_object('seller_id',get_profile_id('ed222222-2222-4222-8222-222222222222'),'title','Fixture feed','description','Real catalogue test fixture','category','Pet Food','price',1250.50,'stock_quantity',3,'images','[]'::jsonb,'location','Lagos','is_active',true,'is_approved',true),(SELECT updated_at FROM marketplace_listings WHERE id='ed444444-4444-4444-8444-444444444444'));
SELECT shop_test_assert(EXISTS(SELECT 1 FROM shop_catalogue WHERE id='ed444444-4444-4444-8444-444444444444' AND seller_name='Fixture Store'),'approved product has public seller display name');
SELECT shop_test_denied($q$ SELECT admin_save_shop_product('ed444444-4444-4444-8444-444444444444',jsonb_build_object('seller_id',get_profile_id('ed222222-2222-4222-8222-222222222222'),'title','Stale edit','category','Pet Food','price',10,'stock_quantity',2,'images','[]'::jsonb,'is_active',true,'is_approved',true),'2000-01-01') $q$,'40001','stale changes cannot overwrite current stock');
SELECT shop_test_denied($q$ SELECT admin_save_shop_product('ed444444-4444-4444-8444-444444444444',jsonb_build_object('seller_id',get_profile_id('ed222222-2222-4222-8222-222222222222'),'title','Bad price','category','Pet Food','price',1.001,'stock_quantity',2,'images','[]'::jsonb,'is_active',true,'is_approved',true),(SELECT updated_at FROM marketplace_listings WHERE id='ed444444-4444-4444-8444-444444444444')) $q$,'22023','fractional minor-unit price denied');
SELECT shop_test_denied($q$ SELECT admin_save_shop_product('ed444444-4444-4444-8444-444444444444',jsonb_build_object('seller_id',get_profile_id('ed222222-2222-4222-8222-222222222222'),'title','Bad stock','category','Pet Food','price',1,'stock_quantity',-1,'images','[]'::jsonb,'is_active',true,'is_approved',true),(SELECT updated_at FROM marketplace_listings WHERE id='ed444444-4444-4444-8444-444444444444')) $q$,'22023','negative stock denied');
SELECT set_config('request.jwt.claim.sub','ed333333-3333-4333-8333-333333333333',true);
SELECT shop_test_assert(EXISTS(SELECT 1 FROM shop_catalogue WHERE id='ed444444-4444-4444-8444-444444444444'),'buyer sees published eligible product');
SELECT shop_test_denied($q$ SELECT admin_save_shop_product('ed444444-4444-4444-8444-444444444444','{}') $q$,'42501','buyer cannot update catalogue');
RESET ROLE;
UPDATE profiles SET is_active=false WHERE user_id='ed222222-2222-4222-8222-222222222222';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ed333333-3333-4333-8333-333333333333',true);
SELECT shop_test_assert(NOT EXISTS(SELECT 1 FROM shop_catalogue WHERE id='ed444444-4444-4444-8444-444444444444'),'suspended seller disappears from shop');
SELECT set_config('request.jwt.claim.sub','ed111111-1111-4111-8111-111111111111',true);
SELECT shop_test_denied($q$ SELECT admin_save_shop_product('ed444444-4444-4444-8444-444444444444',jsonb_build_object('seller_id',get_profile_id('ed222222-2222-4222-8222-222222222222'),'title','Blocked publish','category','Pet Food','price',10,'stock_quantity',2,'images','[]'::jsonb,'is_active',true,'is_approved',true),(SELECT updated_at FROM marketplace_listings WHERE id='ed444444-4444-4444-8444-444444444444')) $q$,'22023','suspended seller cannot be republished');
SELECT admin_save_shop_product('ed444444-4444-4444-8444-444444444444',jsonb_build_object('seller_id',get_profile_id('ed222222-2222-4222-8222-222222222222'),'title','Fixture feed','category','Pet Food','price',1250.50,'stock_quantity',3,'images','[]'::jsonb,'is_active',false,'is_approved',true),(SELECT updated_at FROM marketplace_listings WHERE id='ed444444-4444-4444-8444-444444444444'));
SELECT shop_test_assert((SELECT NOT is_active FROM marketplace_listings WHERE id='ed444444-4444-4444-8444-444444444444'),'admin can hide suspended seller product without deletion');
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ed333333-3333-4333-8333-333333333333',true);
SELECT save_provider_draft('{"name":"Fixture Approved Store","slug":"shop-catalogue-fixture-org","provider_type":"pet_store","email":"store@example.invalid","city":"Abuja","state":"FCT","address":"12 Fixture Road"}');
RESET ROLE;
UPDATE provider_organizations SET verification_status='approved',status='active' WHERE slug='shop-catalogue-fixture-org';
SELECT shop_test_assert(shop_seller_eligible(get_profile_id('ed333333-3333-4333-8333-333333333333')),'approved organization owner is eligible without legacy profile approval');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ed111111-1111-4111-8111-111111111111',true);
SELECT shop_test_assert(EXISTS(SELECT 1 FROM admin_shop_sellers() WHERE name='Fixture Approved Store'),'admin sees approved organization name');
SELECT shop_test_denied($q$ SELECT admin_save_shop_product('ed555555-5555-4555-8555-555555555555',jsonb_build_object('seller_id',get_profile_id('ed333333-3333-4333-8333-333333333333'),'title','Image test','category','Pet Food','price',1,'stock_quantity',1,'images','["javascript:alert(1)"]'::jsonb,'is_active',false,'is_approved',false)) $q$,'22023','unsafe image URL denied');
SELECT shop_test_denied($q$ SELECT admin_save_shop_product('ed555555-5555-4555-8555-555555555555',jsonb_build_object('seller_id',get_profile_id('ed333333-3333-4333-8333-333333333333'),'title','Mass assignment','category','Pet Food','price',1,'stock_quantity',1,'images','[]'::jsonb,'is_active',false,'is_approved',false,'created_by',auth.uid())) $q$,'22023','unexpected actor fields rejected');
RESET ROLE;
