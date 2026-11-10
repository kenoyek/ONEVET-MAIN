import { forwardRef, useRef } from 'react';
import { Bold, Heading2, List, Quote } from 'lucide-react';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatArticleSelection, type ArticleFormat } from '@/lib/article-formatting';

type Props = Omit<TextareaProps, 'value' | 'onChange'> & { value: string; onChange: (value: string) => void };
const formats = [
  { format: 'heading', label: 'Section heading', Icon: Heading2 },
  { format: 'bold', label: 'Bold', Icon: Bold },
  { format: 'list', label: 'Bullet list', Icon: List },
  { format: 'quote', label: 'Callout', Icon: Quote },
] as const;

export const ArticleMarkdownEditor = forwardRef<HTMLTextAreaElement, Props>(({ value, onChange, disabled, ...props }, forwardedRef) => {
  const input = useRef<HTMLTextAreaElement | null>(null);
  function apply(format: ArticleFormat) {
    const element = input.current;
    if (!element) return;
    const result = formatArticleSelection(value, element.selectionStart, element.selectionEnd, format);
    onChange(result.text);
    requestAnimationFrame(() => { element.focus(); element.setSelectionRange(result.start, result.end); });
  }
  return <div className="space-y-2">
    <div role="group" aria-label="Article formatting" className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
      {formats.map(({ format, label, Icon }) => <Button key={format} type="button" size="sm" variant="ghost" disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={() => apply(format)}>
        <Icon className="mr-2 h-4 w-4" aria-hidden="true" />{label}
      </Button>)}
    </div>
    <Textarea {...props} value={value} disabled={disabled} onChange={event => onChange(event.target.value)} ref={element => {
      input.current = element;
      if (typeof forwardedRef === 'function') forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    }} />
  </div>;
});
ArticleMarkdownEditor.displayName = 'ArticleMarkdownEditor';
