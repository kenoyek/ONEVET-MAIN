import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { adminShopService, type ShopProduct } from '@/lib/services/admin-shop-service';
import { Navbar } from '@/components/layout/Navbar';
import { PageHeading } from '@/components/layout/PageHeading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShopProductEditor } from '@/components/admin/ShopProductEditor';

export default function ShopCatalogue(){
 const {user}=useAuth();const cache=useQueryClient();const [search,setSearch]=useState('');const [status,setStatus]=useState('all');const [editing,setEditing]=useState<ShopProduct|null|undefined>(undefined);
 const products=useQuery({queryKey:['admin-shop-products',user?.id],queryFn:adminShopService.list,refetchInterval:30_000});
 const sellers=useQuery({queryKey:['admin-shop-sellers',user?.id],queryFn:adminShopService.sellers});
 const rows=(products.data||[]).filter(row=>(!search||row.title.toLowerCase().includes(search.toLowerCase()))&&(status==='all'||status==='published'&&row.is_active&&row.is_approved||status==='private'&&!(row.is_active&&row.is_approved)));
 const ready=!products.isPending&&!sellers.isPending&&!products.isError&&!sellers.isError;
 return <div className="min-h-screen bg-background"><Navbar/><main id="main-content" tabIndex={-1} className="container-wide pt-28 md:pt-32 pb-24">
  <Link to="/admin" className="text-sm text-primary underline underline-offset-4">Back to admin</Link>
  <PageHeading title="Shop catalogue" description="Manage real products, prices and stock. Publishing does not enable payments." className="my-7" actions={<Button disabled={!ready||!sellers.data?.length} onClick={()=>setEditing(null)}>Add product</Button>}/>
  {(products.isError||sellers.isError)&&<section role="alert" className="mb-6 rounded-xl border bg-card p-5"><p>We couldn’t load the catalogue or seller approvals.</p><Button variant="outline" className="mt-3" onClick={()=>{products.refetch();sellers.refetch();}}>Try again</Button></section>}
  {(products.isPending||sellers.isPending)&&<p role="status" className="py-6">Loading products and approved sellers…</p>}
  {ready&&!sellers.data?.length&&<section className="mb-6 rounded-2xl border bg-card p-6"><h2 className="text-xl mb-3">An approved seller is needed first</h2><p className="text-sm text-muted-foreground mb-4">Register a real business and complete its review before adding products. Existing listings can still be hidden.</p><div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/provider/register">Register a business</Link></Button><Button asChild variant="ghost"><Link to="/admin/verifications">Review organizations</Link></Button></div></section>}
  {editing!==undefined&&<ShopProductEditor key={editing?.id||'new'} product={editing} sellers={sellers.data||[]} onClose={()=>setEditing(undefined)} onSaved={()=>{setEditing(undefined);for(const key of ['admin-shop-products','marketplace-listings','cart-catalogue','product'])void cache.invalidateQueries({queryKey:[key]});}}/>}
  {ready&&<><div className="mb-6 flex flex-wrap gap-3"><Input aria-label="Search catalogue" placeholder="Search product names…" value={search} onChange={event=>setSearch(event.target.value)} className="max-w-md"/><select aria-label="Filter visibility" value={status} onChange={event=>setStatus(event.target.value)} className="h-11 rounded-xl border bg-card px-3"><option value="all">All products</option><option value="published">Published</option><option value="private">Draft or hidden</option></select><Button asChild variant="outline"><Link to="/marketplace">View shop</Link></Button></div>
   {!rows.length?<section className="rounded-2xl border border-dashed p-8 text-center"><h2 className="text-xl mb-2">{products.data?.length?'No matching products':'No products added yet'}</h2><p className="text-muted-foreground">{products.data?.length?'Try a different search or visibility filter.':'Use Add product when a real approved seller and catalogue are ready.'}</p></section>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map(row=><article key={row.id} className="min-w-0 rounded-2xl border bg-card p-5"><div className="flex flex-wrap gap-2 mb-4"><Badge variant={row.is_active&&row.is_approved?'default':'secondary'}>{row.is_active&&row.is_approved?(sellers.data?.some(seller=>seller.id===row.seller_id)?'Published':'Published — seller blocked'):row.is_approved?'Hidden':'Draft'}</Badge><Badge variant="outline">{row.category}</Badge></div><h2 className="text-xl font-semibold break-words">{row.title}</h2><p className="mt-3 font-semibold">₦{row.price.toLocaleString('en-NG',{minimumFractionDigits:2})}</p><p className="text-sm text-muted-foreground mt-2">{row.stock_quantity||0} units in stock</p><p className="text-xs text-muted-foreground mt-3">{sellers.data?.find(seller=>seller.id===row.seller_id)?.name||'Seller is not currently eligible to publish'}</p><Button variant="outline" className="mt-5" onClick={()=>setEditing(row)} aria-label={`Edit ${row.title}`}>Edit product</Button></article>)}</div>}
  </>}
 </main></div>;
}
