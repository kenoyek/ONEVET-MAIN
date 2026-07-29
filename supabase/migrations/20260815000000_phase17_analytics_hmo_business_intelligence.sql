-- 1Vet Migration Phase 17: Analytics, Reporting and HMO Business Intelligence

-- 1. Create hmo_financial_metrics View
CREATE OR REPLACE VIEW public.hmo_financial_metrics AS
SELECT
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE payment_status = 'paid') AS total_gross_booking_gmv,
  (SELECT COALESCE(SUM(platform_fee), 0) FROM public.bookings WHERE payment_status = 'paid') AS total_platform_fees_earned,
  (SELECT COALESCE(SUM(held_amount), 0) FROM public.escrow_accounts WHERE status = 'held') AS current_escrow_held,
  (SELECT COALESCE(SUM(amount_released), 0) FROM public.escrow_releases) AS total_escrow_released,
  (SELECT COUNT(*) FROM public.pet_hmo_subscriptions WHERE status = 'active') AS total_active_hmo_subscriptions,
  (SELECT COALESCE(SUM(approved_amount), 0) FROM public.hmo_claims WHERE status = 'approved') AS total_hmo_claims_paid;

-- 2. Create provider_performance_analytics View
CREATE OR REPLACE VIEW public.provider_performance_analytics AS
SELECT
  org.id AS provider_id,
  org.name AS provider_name,
  org.provider_type,
  COUNT(b.id) AS total_bookings_received,
  COUNT(b.id) FILTER (WHERE b.status = 'completed') AS total_bookings_completed,
  COUNT(b.id) FILTER (WHERE b.status LIKE 'cancelled%') AS total_bookings_cancelled,
  COALESCE(SUM(b.total_amount) FILTER (WHERE b.status = 'completed'), 0) AS total_revenue_earned
FROM public.provider_organizations org
LEFT JOIN public.bookings b ON org.id = b.provider_id
GROUP BY org.id, org.name, org.provider_type;

-- 3. Create disease_surveillance_reports View
CREATE OR REPLACE VIEW public.disease_surveillance_reports AS
SELECT
  c.diagnosis AS disease_name,
  p.species,
  COUNT(c.id) AS case_count,
  MAX(c.updated_at) AS last_reported_at
FROM public.consultations c
JOIN public.pets p ON c.pet_id = p.id
WHERE c.diagnosis IS NOT NULL AND c.diagnosis != ''
GROUP BY c.diagnosis, p.species;

-- 4. Enable RLS or Permissions on Views
GRANT SELECT ON public.hmo_financial_metrics TO authenticated;
GRANT SELECT ON public.provider_performance_analytics TO authenticated;
GRANT SELECT ON public.disease_surveillance_reports TO authenticated;
