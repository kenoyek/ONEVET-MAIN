import { useState } from 'react';
import type { BoardingListing } from '@/lib/services/boarding-directory';

type SavedFacility = Pick<BoardingListing, 'slug' | 'name'>;
const storageKey = 'onevet.boarding-shortlist';

function readShortlist(): SavedFacility[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(saved) ? saved.filter(item =>
      typeof item?.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)
      && item.slug.length <= 80 && typeof item.name === 'string',
    ) : [];
  } catch {
    return [];
  }
}

export function useBoardingShortlist() {
  const [saved, setSaved] = useState(readShortlist);
  const [storageError, setStorageError] = useState(false);

  function update({ slug, name }: SavedFacility, keep: boolean) {
    const current = readShortlist();
    const remaining = current.filter(item => item.slug !== slug);
    const next = keep ? [...remaining, { slug, name }] : remaining;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSaved(next);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }

  return { saved, update, storageError };
}
