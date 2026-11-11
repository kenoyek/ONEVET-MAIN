import { supabase } from '@/integrations/supabase/client';

export function licenseStoragePath(value: string) {
  let path = value;
  if (value.startsWith('https://')) {
    const url = new URL(value);
    const base = new URL(import.meta.env.VITE_SUPABASE_URL || 'https://fxvctkfhitpgfyaztqor.supabase.co');
    const prefix = '/storage/v1/object/sign/licenses/';
    if (url.origin !== base.origin || !url.pathname.startsWith(prefix)) throw new Error('Invalid license document');
    path = decodeURIComponent(url.pathname.slice(prefix.length));
  }
  if (!/^[0-9a-f-]{36}\/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(pdf|png|jpe?g)$/i.test(path) || path.includes('..')) throw new Error('Invalid license document');
  return path;
}

export function licenseBelongsToApplicant(value: string | null, userId: string) {
  try { return !!value && !!userId && licenseStoragePath(value).startsWith(userId + '/'); }
  catch { return false; }
}

export async function uploadVeterinaryLicense(userId: string, profileId: string, file: File, licenseNumber: string) {
  if (!licenseNumber.trim() || licenseNumber.trim().length > 100) throw new Error('Enter a valid license number before uploading.');
  const extension: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png' };
  const ext = extension[file.type];
  if (!ext || file.size > 10 * 1024 * 1024 || file.size === 0) throw new Error('Choose a PDF, JPG or PNG up to 10 MB.');
  // New immutable object paths ensure replacements reset professional verification.
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const bucket = supabase.storage.from('licenses');
  const { error } = await bucket.upload(path, file, { upsert: false });
  if (error) throw error;
  try {
    const result = await supabase.from('profiles').update({ license_url: path, license_number: licenseNumber.trim() }).eq('id', profileId).eq('user_id', userId).select('id').single();
    if (result.error) throw result.error;
  } catch (cause) {
    await bucket.remove([path]).catch(() => undefined);
    throw cause;
  }
}

export async function veterinaryLicenseLink(value: string, ownerUserId: string) {
  const path = licenseStoragePath(value);
  if (!path.startsWith(ownerUserId + '/')) throw new Error('The document does not belong to this applicant');
  const { data, error } = await supabase.storage.from('licenses').createSignedUrl(path, 120);
  if (error || !data?.signedUrl) throw error || new Error('Document is unavailable');
  return data.signedUrl;
}
