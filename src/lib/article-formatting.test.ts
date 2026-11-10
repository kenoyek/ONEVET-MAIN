import { describe, expect, it } from 'vitest';
import { formatArticleSelection } from './article-formatting';

describe('article formatting selections', () => {
  it('preserves surrounding text and selects inserted emphasis for replacement', () => {
    const bold = formatArticleSelection('Keep water fresh.', 5, 10, 'bold');
    expect(bold).toEqual({ text: 'Keep **water** fresh.', start: 7, end: 12 });
    expect(formatArticleSelection(bold.text, bold.start, bold.end, 'bold').text).toBe('Keep water fresh.');
  });
  it('formats only selected full lines and leaves the next line untouched', () => {
    const text = 'Intro\nWater\nFeed\nConclusion';
    const list = formatArticleSelection(text, 6, 17, 'list');
    expect(list.text).toBe('Intro\n- Water\n- Feed\nConclusion');
    expect(formatArticleSelection(list.text, list.start, list.end, 'list').text).toBe(text);
  });
  it('changes the current block format without stacking prefixes', () => {
    expect(formatArticleSelection('## Water', 4, 4, 'quote').text).toBe('> Water');
    expect(formatArticleSelection('Water\nFeed', 1, 1, 'heading').text).toBe('## Water\nFeed');
  });
  it('starts a usable empty block or emphasis placeholder', () => {
    expect(formatArticleSelection('', 0, 0, 'heading').text).toBe('## ');
    expect(formatArticleSelection('', 0, 0, 'bold')).toEqual({ text: '**bold text**', start: 2, end: 11 });
  });
});
