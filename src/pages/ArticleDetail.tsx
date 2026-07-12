import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
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
  };

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
        <main className="pt-20">
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
      
      <main className="flex-1 pt-20">
        <article className="container-tight py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Back Link */}
            <Link 
              to="/articles" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Link>

            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{article.category}</Badge>
                {article.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">
                  {article.excerpt}
                </p>
              )}

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(article.published_at || article.created_at), 'MMMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.view_count.toLocaleString()} views
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopyLink}>
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('facebook')}>
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('twitter')}>
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Featured Image */}
            {article.image_url && (
              <div className="rounded-xl overflow-hidden mb-8">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-64 md:h-96 object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {article.content.split('\n').map((paragraph, index) => (
                paragraph.trim() ? (
                  <p key={index} className="mb-4 text-foreground leading-relaxed">
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
                          <div className="h-32 bg-gradient-brand rounded-t-lg flex items-center justify-center">
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
