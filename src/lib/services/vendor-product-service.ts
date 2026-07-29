import { supabase } from '@/integrations/supabase/client';

export interface CreateVendorProductInput {
  vendor_id: string; // Provider Organization ID
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  image_url?: string;
  brand?: string;
  sku?: string;
  weight_kg?: number;
}

export const vendorProductService = {
  /**
   * Calculate vendor commission and net payout
   */
  calculateCommission(grossSales: number, commissionRate = 0.10) {
    const gross = Math.max(0, grossSales);
    const commissionAmount = Math.round(gross * commissionRate * 100) / 100;
    const netPayout = Math.round((gross - commissionAmount) * 100) / 100;

    return {
      grossSales: gross,
      commissionRate,
      commissionAmount,
      netPayout,
    };
  },

  /**
   * Create a product listing for a vendor organization
   */
  async createVendorProduct(input: CreateVendorProductInput) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        vendor_id: input.vendor_id,
        name: input.name,
        description: input.description || null,
        category: input.category,
        price: input.price,
        stock: input.stock,
        image_url: input.image_url || null,
        brand: input.brand || null,
        sku: input.sku || null,
        weight_kg: input.weight_kg || null,
        approval_status: 'approved', // Auto-approved for verified vendors
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch products for a specific vendor
   */
  async getVendorProducts(vendorId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Fetch vendor financial commissions summary
   */
  async getVendorCommissions(vendorId: string) {
    const { data, error } = await supabase
      .from('vendor_commissions')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
