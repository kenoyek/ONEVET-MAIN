import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, Save, Loader2, Eye, EyeOff, Image as ImageIcon, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  excerpt: z.string().max(300, 'Excerpt too long').optional(),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_published: z.boolean(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

const categories = [
  'Pet Health',
  'Nutrition',
  'Behavior',
  'Grooming',
  'Training',
  'Livestock',
  'First Aid',
  'Preventive Care',
];

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      tags: '',
      image_url: '',
      is_published: false,
    },
  });

  const fetchArticle = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id || '')
        .single();

      if (error) throw error;

      form.reset({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || '',
        content: data.content,
        category: data.category,
        tags: data.tags?.join(', ') || '',
        image_url: data.image_url || '',
        is_published: data.is_published || false,
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
      navigate('/admin/articles');
    } finally {
      setIsFetching(false);
    }
  }, [id, form, navigate]);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id, fetchArticle]);


  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const onSubmit = async (data: ArticleFormData) => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      const articleData = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        category: data.category,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        image_url: data.image_url || null,
        is_published: data.is_published,
        published_at: data.is_published && !isEditing ? new Date().toISOString() : undefined,
        author_id: isEditing ? undefined : profile.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id || '');

        if (error) throw error;
        toast.success('Article updated successfully!');
      } else {
        const { error } = await supabase
          .from('articles')
          .insert(articleData);

        if (error) throw error;
        toast.success('Article created successfully!');
      }

      navigate('/admin/articles');
    } catch (error: unknown) {
      console.error('Error saving article:', error);
      const err = error as { code?: string; message?: string };
      if (err.code === '23505') {
        toast.error('An article with this slug already exists');
      } else {
        toast.error('Failed to save article');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-wide py-8 pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link to="/admin/articles">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-display font-bold">
                  {isEditing ? 'Edit Article' : 'Create Article'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isEditing ? 'Update your article content' : 'Write educational content for pet owners'}
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Article Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter article title..."
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (!isEditing) {
                                    form.setValue('slug', generateSlug(e.target.value));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">/articles/</span>
                                <Input placeholder="article-slug" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>URL-friendly identifier</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="excerpt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Excerpt</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief summary of the article..."
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Short description for previews</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Write your article content here..."
                                className="min-h-[400px] font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Write in plain text. Use line breaks for paragraphs.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Publish Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Publish</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="is_published"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Published</FormLabel>
                              <FormDescription>
                                Make this article publicly visible
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1" disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {isEditing ? 'Update' : 'Save'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category & Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="dog, health, nutrition"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Comma-separated tags</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Featured Image */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Featured Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="image_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/image.jpg"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>External image URL</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch('image_url') && (
                        <div className="mt-3 relative rounded-lg overflow-hidden">
                          <img
                            src={form.watch('image_url')}
                            alt="Preview"
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </Form>
        </motion.div>
      </main>
    </div>
  );
}
