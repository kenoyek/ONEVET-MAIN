import { PageHeading } from '@/components/layout/PageHeading';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, Clock, Eye, Tag, BookOpen, Share2, 
  Facebook, Twitter, Linkedin, Copy, Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string[];
  image_url: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  author: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  image_url: string | null;
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchArticle = useCallback(async () => {
    if (!slug) return;
    try {
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (articleError) throw articleError;

      // Fetch author from public_profiles
      let author = null;
      if (articleData.author_id) {
        const { data: authorData } = await supabase
          .from('public_profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', articleData.author_id)
          .single();
        author = authorData;
      }

      setArticle({ ...articleData, author } as unknown as Article);

      // Increment view count
      await supabase
        .from('articles')
        .update({ view_count: (articleData.view_count || 0) + 1 })
        .eq('id', articleData.id);

      // Fetch related articles
      const { data: related } = await supabase
        .from('articles')
        .select('id, title, slug, category, image_url')
        .eq('is_published', true)
        .eq('category', articleData.category)
        .neq('id', articleData.id)
        .limit(3);

      setRelatedArticles(related || []);
    } catch (error) {
      console.error('Error fetching article:', error);
      navigate('/articles');
    } finally {
      setIsLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(article?.title || '');
    
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="pt-20">
          <div className="container-tight py-12">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="h-64 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="flex-1 pt-28 md:pt-32 pb-16">
        <article className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Back Link */}
            <Link 
              to="/articles" 
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary mb-10 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to Library
            </Link>

            {/* Header */}
            <header className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{article.category}</Badge>
                {article.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 bg-muted/50 border-none px-4 py-1 rounded-full text-xs font-bold text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <PageHeading size="workspace" className="mb-8" title={<> {article.title} </>}/>

              <div className="card-elevated flex items-center justify-between flex-wrap gap-6 p-6 rounded-[2rem] shadow-soft">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
                    <AvatarImage src={article.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                      {article.author ? `${article.author.first_name?.[0] || ''}${article.author.last_name?.[0] || ''}` : '1V'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm leading-none mb-1">
                      {article.author ? `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() : '1Vet'}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 rounded-full bg-muted/30 text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    {article.view_count.toLocaleString()} Views
                  </div>

                  <Separator orientation="vertical" className="h-8 mx-2" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-full font-bold hover:bg-primary/5">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="card-elevated">
                      <DropdownMenuItem onClick={handleCopyLink} className="font-medium cursor-pointer">
                        {copied ? <Check className="h-4 w-4 mr-2 text-success" /> : <Copy className="h-4 w-4 mr-2" />}
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('facebook')} className="font-medium cursor-pointer">
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('twitter')} className="font-medium cursor-pointer">
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('linkedin')} className="font-medium cursor-pointer">
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {article.image_url && (
              <div className="rounded-3xl overflow-hidden mb-12 shadow-elevated border-8 border-background bg-muted">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-auto max-h-[600px] object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:tracking-tight prose-headings:font-semibold prose-p:font-medium prose-p:leading-relaxed prose-p:text-foreground/80 prose-strong:text-foreground prose-strong:font-bold prose-img:rounded-3xl">
              {article.content.split('\n').map((paragraph, index) => (
                paragraph.trim() ? (
                  <p key={index}>
                    {paragraph}
                  </p>
                ) : null
              ))}
            </div>

            <Separator className="my-12" />

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section>
                <h2 className="text-2xl font-display font-bold mb-6">Related Articles</h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {relatedArticles.map(related => (
                    <Link key={related.id} to={`/articles/${related.slug}`}>
                      <Card className="h-full hover:shadow-md transition-shadow group">
                        {related.image_url ? (
                          <div className="h-32 overflow-hidden rounded-t-lg">
                            <img
                              src={related.image_url}
                              alt={related.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="h-32 bg-primary rounded-t-lg flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-primary-foreground/50" />
                          </div>
                        )}
                        <CardHeader className="pb-4">
                          <Badge variant="outline" className="w-fit mb-2">
                            {related.category}
                          </Badge>
                          <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                            {related.title}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
