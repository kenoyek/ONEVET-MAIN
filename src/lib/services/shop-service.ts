import { supabase } from '@/integrations/supabase/client';
export const shopService = {
  async list(category = 'All') {
    let query = supabase.from('marketplace_listings').select('*').eq('is_active', true).eq('is_approved', true);
    if (category !== 'All') query = query.eq('category', category);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async product(id: string) {
    const { data, error } = await supabase.from('marketplace_listings').select('*').eq('id', id).eq('is_active', true).eq('is_approved', true).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { data: seller } = await supabase.from('public_profiles').select('id,first_name,last_name,business_name').eq('id', data.seller_id).maybeSingle();
    return { ...data, seller };
  },
  async cart(ids: string[]) {
    if (!ids.length) return [];
    const { data, error } = await supabase.from('marketplace_listings').select('id,title,price,images,seller_id,stock_quantity').in('id', ids).eq('is_active', true).eq('is_approved', true);
    if (error) throw error;
    return data || [];
  },
};
