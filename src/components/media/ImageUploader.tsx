import { useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IMAGE_ACCEPT, uploadPlatformImage, validateImageFile, type ImagePurpose } from '@/lib/services/image-upload-service';

type Props = {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  purpose: ImagePurpose;
  maxImages?: number;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
};

export function ImageUploader({ label, images, onChange, purpose, maxImages = 1, disabled, onBusyChange }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  async function upload(files: File[]) {
    if (!files.length || disabled || lock.current) return;
    setError('');
    if ((maxImages === 1 ? files.length : images.length + files.length) > maxImages) { setError(`Use up to ${maxImages} ${maxImages === 1 ? 'image' : 'images'}. Remove an image before adding more.`); return; }
    try { files.forEach(validateImageFile); } catch (cause) { setError((cause as Error).message); return; }
    lock.current = true;
    setBusy(true);
    onBusyChange?.(true);
    const added: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setProgress(`Uploading image ${index + 1} of ${files.length}…`);
        added.push(await uploadPlatformImage(file, purpose));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Upload failed. Please try again.'); }
    finally {
      // Keep successful files if a later upload fails; never discard the existing gallery.
      if (added.length) onChange(maxImages === 1 ? added : [...images, ...added]);
      lock.current = false;
      setBusy(false);
      setProgress('');
      onBusyChange?.(false);
      if (input.current) input.current.value = '';
    }
  }

  return <section aria-label={label} className="space-y-3">
    <p className="text-sm font-medium">{label}</p>
    {!!images.length && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {images.map((url, index) => <figure key={`${url}-${index}`} className="relative min-w-0 overflow-hidden rounded-xl border bg-muted/30">
        <img src={url} alt={`${label} ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
        <Button type="button" size="icon" variant="secondary" disabled={disabled || busy} aria-label={`Remove ${label.toLowerCase()} ${index + 1}`} className="absolute right-2 top-2 shadow-sm" onClick={() => onChange(images.filter((_, i) => i !== index))}><X className="h-4 w-4" /></Button>
        {maxImages > 1 && <figcaption className="px-3 py-2 text-xs text-muted-foreground">{index === 0 ? 'Main product image' : `Product image ${index + 1}`}</figcaption>}
      </figure>)}
    </div>}
    <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-center" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void upload(Array.from(event.dataTransfer.files)); }}>
      <input ref={input} id={id} type="file" accept={IMAGE_ACCEPT} multiple={maxImages > 1} aria-label={`Upload ${label.toLowerCase()}`} className="sr-only" disabled={disabled || busy || (maxImages > 1 && images.length >= maxImages)} onChange={event => { void upload(Array.from(event.target.files || [])); }} />
      <Button type="button" variant="outline" disabled={disabled || busy || (maxImages > 1 && images.length >= maxImages)} onClick={() => input.current?.click()}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}{busy ? 'Uploading…' : maxImages === 1 ? images.length ? 'Replace image' : 'Upload image' : 'Add images'}</Button>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Choose files or drop them here. JPG, PNG or WebP, up to 10 MB each. Images are resized for faster loading.{maxImages > 1 ? ` Up to ${maxImages} images; the first is the main image.` : ' Choose Replace image to update the cover.'}</p>
    </div>
    {progress && <p role="status" className="text-sm text-muted-foreground">{progress}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">Image changes take effect when you save. Use images you have permission to publish.</p>
  </section>;
}
