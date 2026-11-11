import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { prepareImage } from '@/lib/services/image-upload-service';
import { Button } from '@/components/ui/button';

type Props = {
  currentUrl: string | null;
  profileId: string;
  petId?: string;
  onUpload: (url: string) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
};
export function PetPhotoUpload({currentUrl,profileId,onUpload,onRemove,onBusyChange,disabled}:Props) {
  const {user,profile}=useAuth();
  const input=useRef<HTMLInputElement>(null);
  const lock=useRef(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function run(action:()=>Promise<void>){
    if(lock.current||disabled)return;
    lock.current=true;setBusy(true);setError('');onBusyChange?.(true);
    try{await action();}catch(cause){setError(cause instanceof Error?cause.message:'The photo could not be saved. Your previous photo has been kept.');}
    finally{lock.current=false;setBusy(false);onBusyChange?.(false);if(input.current)input.current.value='';}
  }
  async function upload(file:File){
    await run(async()=>{
      if(!user||!profile||profile.id!==profileId||profile.user_id!==user.id)throw new Error('Your account is still loading. Please try again.');
      if(!file.size||file.size>5*1024*1024)throw new Error('Choose a non-empty image up to 5 MB.');
      const blob=await prepareImage(file);
      const path=`${user.id}/${crypto.randomUUID()}.${blob.type==='image/webp'?'webp':'png'}`;
      const bucket=supabase.storage.from('pet-avatars');
      const {error:uploadError}=await bucket.upload(path,blob,{upsert:false,contentType:blob.type});
      if(uploadError)throw new Error('Photo upload failed. Your previous photo has been kept. Please try again.');
      await onUpload(bucket.getPublicUrl(path).data.publicUrl);
    });
  }
  return <section aria-label="Pet photo" className="flex flex-col items-center gap-4">
    <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border bg-muted">{currentUrl?<img src={currentUrl} alt="Pet photo" className="h-full w-full object-cover"/>:<Camera className="h-8 w-8 text-muted-foreground" aria-hidden="true"/>}</div>
    <input ref={input} type="file" aria-label="Upload pet photo" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy||disabled} onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);}}/>
    <Button type="button" variant="outline" disabled={busy||disabled} onClick={()=>input.current?.click()}>{busy?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Camera className="mr-2 h-4 w-4"/>}{busy?'Saving photo…':currentUrl?'Replace photo':'Upload photo'}</Button>
    <p className="text-xs text-muted-foreground text-center">JPG, PNG or WebP · up to 5 MB. Photos are resized for faster loading.</p>
    {currentUrl&&onRemove&&<Button type="button" variant="ghost" disabled={busy||disabled} onClick={()=>void run(async()=>{await onRemove();})}><X className="mr-1 h-4 w-4"/>Remove Photo</Button>}
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
