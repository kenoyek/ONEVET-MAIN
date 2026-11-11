import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShopProductEditor } from '@/components/admin/ShopProductEditor';
import { adminShopService, shopProductSchema } from '@/lib/services/admin-shop-service';
vi.mock('@/integrations/supabase/client',()=>({supabase:{}}));
const seller='fa111111-1111-4111-8111-111111111111';
const id='fa222222-2222-4222-8222-222222222222';
const base={seller_id:seller,title:'Layer feed',description:'Real stock details',category:'Livestock' as const,price:'1250.50',stock_quantity:'3',images:'https://example.invalid/feed.webp',location:'Abuja',visibility:'draft' as const};
beforeEach(()=>vi.stubGlobal('crypto',{randomUUID:()=>id}));
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
function fill(){for(const [label,value] of [['Product name','Layer feed'],['Unit price (NGN)','1250.50'],['Units in stock','3'],['Seller',seller]] as const)fireEvent.change(screen.getByLabelText(label),{target:{value}});}
describe('admin product editor',()=>{
 it('validates money, stock and safe image URLs',()=>{
  expect(shopProductSchema.parse(base)).toMatchObject({price:1250.5,stock_quantity:3,images:['https://example.invalid/feed.webp']});
  for(const input of [{price:'1.001'},{stock_quantity:'-1'},{stock_quantity:'1.5'},{images:'javascript:alert(1)'},{images:'https://user:secret@example.invalid/a.jpg'}])expect(shopProductSchema.safeParse({...base,...input}).success).toBe(false);
 });
 it('keeps a stable creation ID and sends one pending save without implicitly publishing',async()=>{
  let finish!:(value:{id:string;updated_at:string})=>void;
  const save=vi.spyOn(adminShopService,'save').mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  const done=vi.fn();const {container}=render(<ShopProductEditor product={null} sellers={[{id:seller,name:'Real seller'}]} onSaved={done} onClose={()=>{}}/>);
  fill();fireEvent.submit(container.querySelector('form')!);fireEvent.submit(container.querySelector('form')!);
  expect(save).toHaveBeenCalledTimes(1);expect(save).toHaveBeenCalledWith(id,expect.objectContaining({visibility:'draft',seller_id:seller}),null);
  expect(screen.getByLabelText('Product name')).toBeDisabled();finish({id,updated_at:'2026-11-11T10:00:00Z'});await waitFor(()=>expect(done).toHaveBeenCalledOnce());
 });
 it('retains edits after a stale-save failure and does not report success',async()=>{
  vi.spyOn(adminShopService,'save').mockRejectedValue({code:'40001'});const done=vi.fn();
  const {container}=render(<ShopProductEditor product={null} sellers={[{id:seller,name:'Real seller'}]} onSaved={done} onClose={()=>{}}/>);fill();fireEvent.submit(container.querySelector('form')!);
  await screen.findByRole('alert');expect(screen.getByLabelText('Product name')).toHaveValue('Layer feed');expect(done).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent('reload the catalogue');
 });
});
