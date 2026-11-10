import { describe, expect, it, vi } from 'vitest';
import { articlePublicationState } from './article-publication';

describe('article publication dates', () => {
  const original = '2026-11-09T10:00:00.000Z';
  it('leaves a never-published draft without a publication date', () => {
    const now = vi.fn();
    expect(articlePublicationState(false, null, now)).toEqual({ is_published: false, published_at: null });
    expect(now).not.toHaveBeenCalled();
  });
  it('dates the first publication of a saved or new draft', () => {
    expect(articlePublicationState(true, null, () => original)).toEqual({ is_published: true, published_at: original });
  });
  it.each([true, false])('preserves the first date when visibility becomes %s', publish => {
    const now = vi.fn();
    expect(articlePublicationState(publish, original, now)).toEqual({ is_published: publish, published_at: original });
    expect(now).not.toHaveBeenCalled();
  });
});
