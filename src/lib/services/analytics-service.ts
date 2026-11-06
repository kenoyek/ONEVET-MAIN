import { plannedSupabase as supabase } from '@/integrations/supabase/planned-client';

export const analyticsService = {
  /**
   * Fetch platform executive HMO financial metrics
   */
  async getPlatformFinancialMetrics() {
    const { data, error } = await supabase
      .from('hmo_financial_metrics')
      .select('*')
      .maybeSingle();

    if (error) console.warn('[AnalyticsService] Financial metrics fetch notice:', error.message);
    return (
      data || {
        total_gross_booking_gmv: 0,
        total_platform_fees_earned: 0,
        current_escrow_held: 0,
        total_escrow_released: 0,
        total_active_hmo_subscriptions: 0,
        total_hmo_claims_paid: 0,
      }
    );
  },

  /**
   * Fetch performance analytics for a specific provider organization
   */
  async getProviderAnalytics(providerId: string) {
    const { data, error } = await supabase
      .from('provider_performance_analytics')
      .select('*')
      .eq('provider_id', providerId)
      .maybeSingle();

    if (error) console.warn('[AnalyticsService] Provider analytics fetch notice:', error.message);
    return data;
  },

  /**
   * Fetch disease surveillance reports for veterinary public health monitoring
   */
  async getDiseaseSurveillanceData() {
    const { data, error } = await supabase
      .from('disease_surveillance_reports')
      .select('*')
      .order('case_count', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
