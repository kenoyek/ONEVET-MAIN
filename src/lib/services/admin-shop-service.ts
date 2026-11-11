import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
export type ShopProduct = Database['public']['Tables']['marketplace_listings']['Row'];
export const shopCategories = ['Pet Food','Pet Health','Pet Supplies','Livestock','Accessories'] as const;
export const shopProductSchema = z.object({
  seller_id: z.string().uuid('Choose a seller.'),
  title: z.string().trim().min(2,'Enter a product name.').max(160),
  description: z.string().trim().max(5000), category: z.enum(shopCategories),
  price: z.string().trim().regex(/^\d{1,8}(\.\d{1,2})?$/, 'Enter a price with up to two decimal places.').transform(Number),
  stock_quantity: z.string().trim().regex(/^\d{1,10}$/, 'Enter a whole stock quantity.').transform(Number).refine(n=>n<=2147483647,'Stock quantity is too large.'),
  location: z.string().trim().max(160),
  images: z.string().transform(value=>value.split('\n').map(url=>url.trim()).filter(Boolean)).pipe(z.array(z.string().url('Use full image URLs.').max(2000).refine(value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}},'Use HTTPS image URLs without embedded credentials.')).max(5,'Use at most five images.')),
  visibility: z.enum(['draft','published','hidden']),
});
export type ShopProductForm = z.input<typeof shopProductSchema>;
export const adminShopService = {
  async list() { const {data,error}=await supabase.from('marketplace_listings').select('*').order('updated_at',{ascending:false});if(error)throw error;return data||[]; },
  async sellers() { const {data,error}=await supabase.rpc('admin_shop_sellers');if(error)throw error;return data||[]; },
  async save(id:string, input:ShopProductForm, expected:string|null) {
    const {visibility,...fields}=shopProductSchema.parse(input);
    const details={...fields,is_active:visibility==='published',is_approved:visibility!=='draft'};
    const {data,error}=await supabase.rpc('admin_save_shop_product',{product_uuid:id,details:details as Json,expected_updated_at:expected}).single();
    if(error)throw error;return data;
  },
};
export function shopSaveError(cause:unknown){
 const error=cause as {code?:string};
 if(error?.code==='40001')return 'This product changed or was already saved. Close the editor, reload the catalogue and review the latest record.';
 if(error?.code==='42501')return 'Your administrator access is unavailable. Sign in again before saving.';
 return 'The product could not be saved. Check the details and seller approval, then try again.';
}
