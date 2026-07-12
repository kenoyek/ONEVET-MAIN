import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Search, BookOpen, Clock, Eye, ChevronRight, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  image_url: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

const categories = [
  'All',
  'Pet Health',
  'Nutrition',
  'Behavior',
  'Grooming',
  'Training',
  'Livestock',
];

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, category, tags, image_url, view_count, published_at, created_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background bg-mesh-gradient flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden liquid-bg">
          <div className="container-wide text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary px-4 py-1 rounded-full uppercase tracking-widest text-[10px] font-bold bg-background">
                Knowledge Base
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6 tracking-tighter heading-safe">
                Insights for <span className="text-gradient-brand">animal health.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 font-medium leading-relaxed">
                Expert-authored guides, medical breakthroughs, and essential tips to help your animal companions thrive.
              </p>
              
              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles, symptoms, or guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 h-16 text-lg rounded-full bg-card border-border/50 shadow-soft focus:shadow-glow transition-all"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="sticky top-16 md:top-20 bg-background/80 backdrop-blur-xl z-20 border-y border-border/40">
          <div className="container-wide py-4 overflow-x-auto scrollbar-hide">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="h-auto flex justify-start sm:justify-center gap-2 bg-transparent p-0">
                {categories.map(cat => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="rounded-full px-6 py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="section-padding pt-16">
          <div className="container-wide">
            {isLoading ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                    <Skeleton className="h-6 w-3/4 rounded-full" />
                    <Skeleton className="h-4 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">No articles discovered</h3>
                <p className="text-muted-foreground font-medium">
                  Try refining your search terms or exploring other categories.
                </p>
                <Button variant="link" onClick={() => {setSearchQuery(''); setSelectedCategory('All');}} className="mt-4 font-bold">Clear all filters</Button>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                  >
                    <Link to={`/articles/${article.slug}`} className="group block h-full">
                      <Card className="glass-card h-full rounded-[2.5rem] overflow-hidden hover:shadow-elevated hover:-translate-y-2 transition-all duration-500 flex flex-col">
                        <div className="relative h-64 overflow-hidden m-2 rounded-[2rem]">
                          {article.image_url ? (
                            <img
                              src={article.image_url}
                              alt={article.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-brand flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-white/50" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-background/90 backdrop-blur-md text-foreground border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                              {article.category}
                            </Badge>
                          </div>
                        </div>
                        <CardHeader className="p-8 pb-4 flex-grow">
                          <CardTitle className="text-2xl font-black line-clamp-2 group-hover:text-primary transition-colors tracking-tight leading-tight mb-4">
                            {article.title}
                          </CardTitle>
                          {article.excerpt && (
                            <CardDescription className="line-clamp-3 text-sm font-medium leading-relaxed">
                              {article.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                          <div className="flex items-center justify-between border-t border-border/40 pt-6">
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Eye className="h-3.5 w-3.5" />
                                {article.view_count.toLocaleString()}
                              </span>
                            </div>
                            <div className="p-2 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
