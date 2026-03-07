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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-subtle py-16 border-b">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Pet Education Hub</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                Learn About Pet Care
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Expert articles and guides to help you take the best care of your furry friends
              </p>
              
              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-b sticky top-16 md:top-20 bg-background/95 backdrop-blur z-10">
          <div className="container-wide py-4">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
                {categories.map(cat => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-12">
          <div className="container-wide">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full rounded-t-lg" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or category filter
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/articles/${article.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                        {article.image_url ? (
                          <div className="h-48 overflow-hidden">
                            <img
                              src={article.image_url}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="h-48 bg-gradient-brand flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-primary-foreground/50" />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{article.category}</Badge>
                          </div>
                          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </CardTitle>
                          {article.excerpt && (
                            <CardDescription className="line-clamp-2">
                              {article.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(article.published_at || article.created_at), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {article.view_count}
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
