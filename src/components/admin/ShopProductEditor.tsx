import { ImageUploader } from '@/components/media/ImageUploader';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminShopService, shopCategories, shopProductSchema, shopSaveError, type ShopProduct, type ShopProductForm } from '@/lib/services/admin-shop-service';

export function ShopProductEditor({ product, sellers, onSaved, onClose }: {product:ShopProduct|null;sellers:{id:string;name:string}[];onSaved:()=>void;onClose:()=>void}) {
 const [id]=useState(()=>product?.id||crypto.randomUUID());
 const [form,setForm]=useState<ShopProductForm>(()=>({seller_id:product?.seller_id||'',title:product?.title||'',description:product?.description||'',category:(product?.category||'Pet Food') as ShopProductForm['category'],price:product?String(product.price):'',stock_quantity:String(product?.stock_quantity||0),location:product?.location||'',images:product?.images?.join('\n')||'',visibility:product?.is_active&&product.is_approved?'published':product?.is_approved?'hidden':'draft'}));
 const [imageUploading,setImageUploading]=useState(false);
 const [busy,setBusy]=useState(false);const lock=useRef(false);const [error,setError]=useState('');const [fields,setFields]=useState<Record<string,string>>({});
 function change(key:keyof ShopProductForm,value:string){setForm(old=>({...old,[key]:value}));}
 async function save(event:React.FormEvent){event.preventDefault();if(lock.current||imageUploading)return;setError('');setFields({});const parsed=shopProductSchema.safeParse(form);if(!parsed.success){const errors:Record<string,string>={};for(const issue of parsed.error.issues)errors[String(issue.path[0])]=issue.message;setFields(errors);setError('Check the highlighted product fields before saving.');return;}lock.current=true;setBusy(true);try{await adminShopService.save(id,form,product?.updated_at||null);onSaved();}catch(cause){setError(shopSaveError(cause));}finally{lock.current=false;setBusy(false);}}
 return <section className="mb-8 rounded-2xl border bg-card p-5 sm:p-8" aria-label="Product editor">
  <h2 className="text-2xl mb-2">{product?'Edit product':'Add a real product'}</h2><p className="text-sm text-muted-foreground mb-6">Drafts stay private. Published products appear only while the seller remains eligible. Hidden products leave the shop without deleting order history. Payments remain unavailable.</p>
  <form noValidate onSubmit={save} className="space-y-5"><fieldset disabled={busy} className="space-y-5 min-w-0">
   <div className="grid gap-5 sm:grid-cols-2">
    <div className="space-y-2"><Label htmlFor="shop-seller">Seller</Label><select id="shop-seller" value={form.seller_id} disabled={!!product} onChange={event=>change('seller_id',event.target.value)} className="w-full h-11 rounded-xl border bg-background px-3"><option value="">Choose an approved seller</option>{product&&!sellers.some(s=>s.id===product.seller_id)&&<option value={product.seller_id}>Current seller (not eligible to publish)</option>}{sellers.map(seller=><option key={seller.id} value={seller.id}>{seller.name}</option>)}</select>{fields.seller_id&&<p className="text-sm text-destructive">{fields.seller_id}</p>}</div>
    <div className="space-y-2"><Label htmlFor="shop-category">Category</Label><select id="shop-category" value={form.category} onChange={event=>change('category',event.target.value)} className="w-full h-11 rounded-xl border bg-background px-3">{shopCategories.map(category=><option key={category}>{category}</option>)}</select></div>
    {([['title','Product name'],['price','Unit price (NGN)'],['stock_quantity','Units in stock'],['location','Location (optional)']] as const).map(([key,label])=><div key={key} className="space-y-2"><Label htmlFor={`shop-${key}`}>{label}</Label><Input id={`shop-${key}`} value={form[key]} inputMode={key==='price'?'decimal':key==='stock_quantity'?'numeric':undefined} onChange={event=>change(key,event.target.value)} aria-invalid={!!fields[key]} aria-describedby={fields[key]?`shop-${key}-error`:undefined}/>{fields[key]&&<p id={`shop-${key}-error`} className="text-sm text-destructive">{fields[key]}</p>}</div>)}
   </div>
   <div className="space-y-2"><Label htmlFor="shop-description">Description</Label><Textarea id="shop-description" value={form.description} onChange={event=>change('description',event.target.value)} maxLength={5000}/></div>
   <ImageUploader label="Product images" purpose="shop" maxImages={5} images={form.images.split('\n').filter(Boolean)} onChange={images=>change('images',images.join('\n'))} onBusyChange={setImageUploading} disabled={busy}/>

   <div className="space-y-2"><Label htmlFor="shop-visibility">Visibility</Label><select id="shop-visibility" value={form.visibility} onChange={event=>change('visibility',event.target.value)} className="w-full h-11 rounded-xl border bg-background px-3"><option value="draft">Draft — private</option><option value="published">Published — visible in shop</option><option value="hidden">Hidden — withdrawn from shop</option></select></div>
   <div className="flex flex-wrap gap-3"><Button type="submit" disabled={imageUploading}>{busy?'Saving…':form.visibility==='published'?'Save and publish':'Save product'}</Button><Button type="button" variant="outline" disabled={imageUploading} onClick={onClose}>Close editor</Button></div>
  </fieldset>{error&&<p role="alert" className="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}</form>
 </section>;
}
