import { beforeEach, describe, expect, it } from 'vitest';
import { articleDraftKey, readArticleDraft, writeArticleDraft, ARTICLE_DRAFT_MAX_AGE } from './article-browser-draft';

const values = { title: '', slug: '', content: 'Incomplete writing', category: '', is_published: false };
beforeEach(() => localStorage.clear());
describe('browser article backups', () => {
  it('keeps incomplete drafts separate by account and article', () => {
    const key = articleDraftKey('account-a', 'article-one');
    writeArticleDraft(localStorage, key, values, 1000);
    expect(readArticleDraft(localStorage, key, 1100)?.values.content).toBe(values.content);
    expect(readArticleDraft(localStorage, articleDraftKey('account-b', 'article-one'), 1100)).toBeNull();
    expect(readArticleDraft(localStorage, articleDraftKey('account-a', 'article-two'), 1100)).toBeNull();
  });
  it.each(['not-json', '{"version":2}', '{"version":1,"savedAt":0,"values":{"title":null}}'])('removes malformed backups safely: %s', raw => {
    localStorage.setItem('test', raw);
    expect(readArticleDraft(localStorage, 'test')).toBeNull();
    expect(localStorage.getItem('test')).toBeNull();
  });
  it('removes expired backups when revisiting the editor', () => {
    writeArticleDraft(localStorage, 'test', values, 1000);
    expect(readArticleDraft(localStorage, 'test', 1001 + ARTICLE_DRAFT_MAX_AGE)).toBeNull();
    expect(localStorage.getItem('test')).toBeNull();
  });
  it('rejects excessive content rather than claiming a backup succeeded', () => {
    expect(() => writeArticleDraft(localStorage, 'test', { ...values, content: 'x'.repeat(500_001) })).toThrow();
    expect(localStorage.getItem('test')).toBeNull();
  });
});
