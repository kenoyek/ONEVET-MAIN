import { supabase } from '@/integrations/supabase/client';
export const shopService = {
  async list(category = 'All') {
    let query = supabase.from('shop_catalogue').select('*').eq('is_active', true).eq('is_approved', true);
    if (category !== 'All') query = query.eq('category', category);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async product(id: string) {
    const { data, error } = await supabase.from('shop_catalogue').select('*').eq('id', id).eq('is_active', true).eq('is_approved', true).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, seller: { business_name: data.seller_name, first_name: null, last_name: null } };
  },
  async cart(ids: string[]) {
    if (!ids.length) return [];
    const { data, error } = await supabase.from('shop_catalogue').select('id,title,price,images,seller_id,stock_quantity').in('id', ids).eq('is_active', true).eq('is_approved', true);
    if (error) throw error;
    return data || [];
  },
};
