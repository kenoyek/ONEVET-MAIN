export type ArticleFormat = 'heading' | 'bold' | 'list' | 'quote';

/** Apply formatting to a selection without changing surrounding draft text. */
export function formatArticleSelection(text: string, start: number, end: number, format: ArticleFormat) {
  if (format === 'bold') {
    if (start >= 2 && text.slice(start - 2, start) === '**' && text.slice(end, end + 2) === '**') {
      return { text: text.slice(0, start - 2) + text.slice(start, end) + text.slice(end + 2), start: start - 2, end: end - 2 };
    }
    const selected = text.slice(start, end);
    if (selected.startsWith('**') && selected.endsWith('**') && selected.length > 4) {
      const replacement = selected.slice(2, -2);
      return { text: text.slice(0, start) + replacement + text.slice(end), start, end: start + replacement.length };
    }
    const replacement = selected || 'bold text';
    return { text: text.slice(0, start) + '**' + replacement + '**' + text.slice(end), start: start + 2, end: start + 2 + replacement.length };
  }
  const lineStart = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
  const lastSelected = end > start && text[end - 1] === '\n' ? end - 1 : end;
  const nextNewline = text.indexOf('\n', lastSelected);
  const lineEnd = nextNewline < 0 ? text.length : nextNewline;
  const lines = text.slice(lineStart, lineEnd).split('\n');
  const prefix = { heading: '## ', list: '- ', quote: '> ' }[format];
  const remove = lines.every(line => line.startsWith(prefix));
  const replacement = lines.map(line => remove ? line.slice(prefix.length) : prefix + line.replace(/^(?:#{1,6}\s+|[-*+]\s+|>\s?)/, '')).join('\n');
  return { text: text.slice(0, lineStart) + replacement + text.slice(lineEnd), start: lineStart, end: lineStart + replacement.length };
}
