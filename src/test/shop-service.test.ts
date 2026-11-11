import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shopService } from '@/lib/services/shop-service';
const mocks=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:mocks.from}}));
function query(result:unknown){const q={select:vi.fn(),eq:vi.fn(),in:vi.fn(),order:vi.fn(),maybeSingle:vi.fn(),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve(result).then(resolve)};q.select.mockReturnValue(q);q.eq.mockReturnValue(q);q.in.mockReturnValue(q);q.order.mockResolvedValue(result);q.maybeSingle.mockResolvedValue(result);return q;}
beforeEach(()=>mocks.from.mockReset());
describe('shop catalogue reads',()=>{
 it('reads approved active products and public seller fields only',async()=>{
  const products=query({data:{id:'p',seller_id:'seller',seller_name:'Store'},error:null});
  mocks.from.mockReturnValueOnce(products);
  expect(await shopService.product('p')).toMatchObject({seller:{business_name:'Store'}});
  expect(products.eq).toHaveBeenCalledWith('is_active',true);expect(products.eq).toHaveBeenCalledWith('is_approved',true);
  expect(mocks.from.mock.calls.map(call=>call[0])).toEqual(['shop_catalogue']);
 });
 it('does not turn a database error into an empty catalogue',async()=>{
  mocks.from.mockReturnValue(query({data:null,error:new Error('offline')}));await expect(shopService.list()).rejects.toThrow('offline');
 });
 it('only revalidates requested cart products and skips empty carts',async()=>{
  expect(await shopService.cart([])).toEqual([]);expect(mocks.from).not.toHaveBeenCalled();
  const q=query({data:[],error:null});mocks.from.mockReturnValue(q);await shopService.cart(['a','b']);expect(q.in).toHaveBeenCalledWith('id',['a','b']);expect(q.eq).toHaveBeenCalledWith('is_approved',true);
 });
});
