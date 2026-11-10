import { z } from 'zod';

const fields = z.object({
  title: z.string(), slug: z.string(), content: z.string(), category: z.string(),
  excerpt: z.string().optional(), tags: z.string().optional(), image_url: z.string().optional(),
  is_published: z.boolean(),
}).strict();
const backup = z.object({ version: z.literal(1), savedAt: z.number().finite(), values: fields }).strict();
export type ArticleBrowserDraft = z.infer<typeof backup>;
export type ArticleDraftFields = z.infer<typeof fields>;
export const ARTICLE_DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_SIZE = 500_000;

export function articleDraftKey(account: string, articleId?: string) {
  return `onevet:article-backup:v1:${encodeURIComponent(account)}:${encodeURIComponent(articleId || 'new')}`;
}
export function readArticleDraft(storage: Storage, key: string, now = Date.now()): ArticleBrowserDraft | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    if (raw.length > MAX_SIZE) throw Error('Oversized backup');
    const parsed = backup.parse(JSON.parse(raw));
    if (parsed.savedAt > now + 60_000 || now - parsed.savedAt > ARTICLE_DRAFT_MAX_AGE) throw Error('Expired backup');
    return parsed;
  } catch {
    storage.removeItem(key);
    return null;
  }
}
export function writeArticleDraft(storage: Storage, key: string, values: unknown, now = Date.now()) {
  const record = backup.parse({ version: 1, savedAt: now, values });
  const serialized = JSON.stringify(record);
  if (serialized.length > MAX_SIZE) throw Error('Backup exceeds browser limit');
  storage.setItem(key, serialized);
  return record;
}
