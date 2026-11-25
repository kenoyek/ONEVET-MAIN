import { useEffect, useState } from 'react';
import type { BoardingListing } from '@/lib/services/boarding-directory';

export type SavedFacility = Pick<BoardingListing, 'slug' | 'name'> & { note?: string; contacted?: boolean };
export const shortlistNoteLimit = 300;
const storageKey = 'onevet.boarding-shortlist';

function readShortlist(): SavedFacility[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(saved) ? saved.filter(item =>
      typeof item?.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)
      && item.slug.length <= 80 && typeof item.name === 'string',
    ).map(({ slug, name, note, contacted }) => ({
      slug, name, note: typeof note === 'string' ? note.slice(0, shortlistNoteLimit) : undefined,
      contacted: contacted === true ? true : undefined,
    })) : [];
  } catch {
    return [];
  }
}

export function useBoardingShortlist() {
  const [saved, setSaved] = useState(readShortlist);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    function syncShortlist(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) {
        setSaved(readShortlist());
      }
    }

    window.addEventListener('storage', syncShortlist);
    return () => window.removeEventListener('storage', syncShortlist);
  }, []);

  function persist(next: SavedFacility[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSaved(next);
      setStorageError(false);
      return true;
    } catch {
      setStorageError(true);
      return false;
    }
  }

  function update({ slug, name }: SavedFacility, keep: boolean) {
    const current = readShortlist();
    if (keep && current.some(item => item.slug === slug)) {
      setSaved(current);
      return;
    }
    persist(keep ? [...current, { slug, name }] : current.filter(item => item.slug !== slug));
  }

  function updateDetails(slug: string, details: Pick<SavedFacility, 'note' | 'contacted'>) {
    const current = readShortlist();
    if (!current.some(item => item.slug === slug)) {
      setSaved(current);
      return false;
    }
    return persist(current.map(item => item.slug === slug
      ? { ...item, ...details }
      : item));
  }

  function updateNote(slug: string, note: string) {
    return updateDetails(slug, { note: note.trim().slice(0, shortlistNoteLimit) || undefined });
  }

  function updateContacted(slug: string, contacted: boolean) {
    return updateDetails(slug, { contacted: contacted || undefined });
  }

  return { saved, update, updateNote, updateContacted, storageError };
}
