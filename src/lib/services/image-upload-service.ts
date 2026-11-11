import { supabase } from '@/integrations/supabase/client';

export type ImagePurpose = 'articles' | 'shop';
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_INPUT = 10 * 1024 * 1024;
const MAX_OUTPUT = 5 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!IMAGE_ACCEPT.split(',').includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
  if (!file.size || file.size > MAX_INPUT) throw new Error('Choose an image smaller than 10 MB.');
}

// Decode and re-encode images to strip metadata, bound dimensions and reject disguised files.
export async function prepareImage(file: File): Promise<Blob> {
  validateImageFile(file);
  const image = await createImageBitmap(file).catch(() => { throw new Error('This image could not be opened. Choose another file.'); });
  try {
    if (!image.width || !image.height || image.width * image.height > 60_000_000) throw new Error('This image is too large. Choose a smaller image.');
    const ratio = Math.min(1, 1920 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image processing failed.')), 'image/webp', 0.86));
    if (blob.size > MAX_OUTPUT) throw new Error('The processed image is too large. Choose a smaller image.');
    return blob;
  } finally { image.close(); }
}

export async function uploadPlatformImage(file: File, purpose: ImagePurpose): Promise<string> {
  const blob = await prepareImage(file);
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) throw new Error('Sign in again before uploading an image.');
  const extension = blob.type === 'image/webp' ? 'webp' : 'png';
  const path = `${data.user.id}/${purpose}/${crypto.randomUUID()}.${extension}`;
  const bucket = supabase.storage.from('platform-images');
  const { error } = await bucket.upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error('The image could not be uploaded. Check your connection and administrator access, then try again.');
  return bucket.getPublicUrl(path).data.publicUrl;
}
