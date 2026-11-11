import { useState } from 'react';
import { BookOpen, ImageOff } from 'lucide-react';
import { ArticleBody } from './ArticleBody';
import { ArticleImage } from './ArticleImage';
import { Badge } from '@/components/ui/badge';

interface ArticleDraft {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string;
  image_url?: string;
}

function PreviewCover({ url, title, mobile }: { url: string; title: string; mobile: boolean }) {
  const [failed, setFailed] = useState(false);
  let valid = false;
  try { valid = ['http:', 'https:'].includes(new URL(url).protocol); } catch { /* Incomplete URL while drafting. */ }
  if (!valid || failed) {
    return <div className="mb-10 rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-muted-foreground" role="status">
      <ImageOff className="mx-auto mb-3 h-7 w-7" aria-hidden="true" />
      <p className="text-sm">This cover could not be loaded. Remove it in the editor and upload another image.</p>
    </div>;
  }
  return <div className="mb-10" onErrorCapture={() => setFailed(true)}>
    <ArticleImage src={url} alt={title} priority className={`w-full aspect-[3/2] ${mobile ? '' : 'md:aspect-[16/9]'} object-cover rounded-2xl bg-muted`} sizes="(max-width: 768px) 100vw, 900px" />
    {url.startsWith('https://1vet.store/images/articles/') && <p className="mt-3 text-xs text-muted-foreground">Illustrative image created for 1Vet.</p>}
  </div>;
}

export function ArticleDraftPreview({ article, mobile = false }: { article: ArticleDraft; mobile?: boolean }) {
  const content = article.content || '';
  const tags = (article.tags || '').split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 3);
  return (
    <article aria-label="Article preview" className={`mx-auto min-w-0 rounded-2xl border border-border bg-background p-5 sm:p-8 ${mobile ? 'article-draft-mobile max-w-[390px]' : 'w-full'}`}>
      <header className="mb-10">
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="secondary">{article.category || 'Category'}</Badge>
          {tags.map((tag, index) => <Badge key={`${tag}-${index}`} variant="outline">{tag}</Badge>)}
        </div>
        <h2 className={`mb-6 break-words font-medium tracking-[-.045em] leading-[1.12] ${mobile ? 'text-[38px]' : 'text-[clamp(38px,4.5vw,64px)]'}`}>{article.title?.trim() || 'Your article title'}</h2>
        {article.excerpt && <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>}
        <p className="border-y border-border py-5 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">1Vet</span>
          <span className="mx-3" aria-hidden="true">·</span>Private preview
          {content.trim() && <><span className="mx-3" aria-hidden="true">·</span>{Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))} min read</>}
        </p>
      </header>
      {article.image_url && <PreviewCover key={article.image_url} url={article.image_url} title={article.title || 'Article cover'} mobile={mobile} />}
      {content.trim() ? <ArticleBody content={content} /> : <div className="rounded-xl bg-muted/40 p-8 text-center text-muted-foreground">
        <BookOpen className="mx-auto mb-3 h-8 w-8" aria-hidden="true" />
        <p>Your article will appear here as you write.</p>
        <p className="mt-2 text-sm">Add headings, paragraphs and an image in the editor, then return to preview.</p>
      </div>}
    </article>
  );
}
