import { articleDraftKey } from '@/lib/article-browser-draft';
import { useArticleBrowserDraft } from '@/hooks/use-article-browser-draft';
import { articlePublicationState } from '@/lib/article-publication';
import { Badge } from '@/components/ui/badge';
import { ArticleMarkdownEditor } from '@/components/articles/ArticleMarkdownEditor';
import { ArticleDraftPreview } from '@/components/articles/ArticleDraftPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeading } from '@/components/layout/PageHeading';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, Save, Loader2, Eye, Pencil, Monitor, Smartphone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  const { profile } = useAuth();
  const { id } = useParams<{ id: string }>();
  return <ArticleEditorForm key={`${profile?.id || 'signed-out'}:${id || 'new'}`} />;
}

function ArticleEditorForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEditing = !!id;
  const saveInFlight = useRef(false);
  const [savedPublication, setSavedPublication] = useState<{ is_published: boolean; published_at: string | null }>({ is_published: false, published_at: null });
  const [editorMode, setEditorMode] = useState('write');
  const [mobilePreview, setMobilePreview] = useState(false);
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

  const draft = useWatch({ control: form.control });
  const browserDraft = useArticleBrowserDraft({
    storageKey: profile?.id ? articleDraftKey(profile.id, id) : null,
    serializedValues: JSON.stringify(draft),
    dirty: form.formState.isDirty,
    paused: isFetching,
  });

  const fetchArticle = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id || '')
        .single();

      if (error) throw error;

      setSavedPublication({ is_published: !!data.is_published, published_at: data.published_at });
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
    if (saveInFlight.current) return;
    if (!profile?.id) {
      toast.error('Your account is not ready to save. Please sign in again.');
      return;
    }
    saveInFlight.current = true;

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
        ...articlePublicationState(data.is_published, savedPublication.published_at),
        author_id: isEditing ? undefined : profile.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id || '')
          .select('id')
          .single();

        if (error) throw error;
        toast.success('Article updated successfully!');
      } else {
        const { error } = await supabase
          .from('articles')
          .insert(articleData)
          .select('id')
          .single();

        if (error) throw error;
        toast.success('Article created successfully!');
      }

      browserDraft.clear();
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
      saveInFlight.current = false;
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container-wide py-8 pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container-wide py-8 pt-24">
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
                <Button variant="ghost" size="icon" aria-label="Back to articles">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <PageHeading size="workspace" className="" title={<> {isEditing ? 'Edit Article' : 'Create Article'} </>}/>
                <p className="text-muted-foreground mt-1">
                  {isEditing ? 'Update your article content' : 'Write educational content for pet owners'}
                </p>
              </div>
            </div>
          </div>

          {browserDraft.recovery && <section aria-label="Recover browser draft" className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <h2 className="font-semibold">Browser draft found</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Writing saved in this browser on {new Date(browserDraft.recovery.savedAt).toLocaleString()}. Restore it to review your changes, or discard the backup to use the current article.</p>
              <p className="mt-2 text-sm text-muted-foreground">Restoring does not publish anything. Visibility will use the article’s current saved setting.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => {
                const recovered = browserDraft.recovery;
                if (!recovered) return;
                form.reset({ ...recovered.values, is_published: savedPublication.is_published }, { keepDefaultValues: true });
                browserDraft.dismissRecovery();
              }}>Restore draft</Button>
              <Button type="button" variant="outline" onClick={browserDraft.dismissRecovery}>Discard backup</Button>
            </div>
          </section>}
          {!browserDraft.recovery && <p role="status" className="mb-4 text-sm text-muted-foreground">
            {browserDraft.status === 'saved' ? 'Browser backup saved. Save the article to keep changes on the site.' : browserDraft.status === 'pending' ? 'Saving a browser backup…' : browserDraft.status === 'unavailable' ? 'Browser backup unavailable. Save the article before leaving.' : 'Unsaved writing is backed up in this browser for up to 7 days.'}
          </p>}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <fieldset disabled={isLoading || !!browserDraft.recovery} className="min-w-0" aria-busy={isLoading}>
              <Tabs value={editorMode} onValueChange={setEditorMode}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <TabsList aria-label="Article editing mode">
                    <TabsTrigger value="write"><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />Write</TabsTrigger>
                    <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4" aria-hidden="true" />Preview</TabsTrigger>
                  </TabsList>
                  {editorMode === 'preview' && <div role="group" aria-label="Preview width" className="flex gap-1">
                    <Button type="button" size="sm" variant={mobilePreview ? 'ghost' : 'secondary'} aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)}><Monitor className="mr-2 h-4 w-4" aria-hidden="true" />Desktop</Button>
                    <Button type="button" size="sm" variant={mobilePreview ? 'secondary' : 'ghost'} aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}><Smartphone className="mr-2 h-4 w-4" aria-hidden="true" />Mobile</Button>
                  </div>}
                </div>
                <TabsContent value="write">
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
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">/articles/</span>
                              <FormControl><Input placeholder="article-slug" {...field} /></FormControl>
                            </div>
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
                              <ArticleMarkdownEditor
                                placeholder="Write your article content here..."
                                className="min-h-[400px] font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Select text and choose a format above, or write Markdown directly. Separate paragraphs with a blank line, then check Preview.
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
                      <CardTitle>Publication</CardTitle>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge variant={savedPublication.is_published ? 'default' : 'secondary'}>{savedPublication.is_published ? 'Published' : 'Draft'}</Badge>
                        {form.formState.isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
                      </div>
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
                                {field.value ? 'Visible in the resource library after saving.' : 'Private and hidden from the resource library after saving.'}
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
                          {isLoading ? 'Saving…' : draft.is_published ? (savedPublication.is_published ? 'Save changes' : 'Publish article') : (savedPublication.is_published ? 'Unpublish article' : 'Save draft')}
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
                            <FormLabel>Cover image URL</FormLabel>
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
                            key={form.watch('image_url')}
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
                </TabsContent>
                <TabsContent value="preview">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Private preview of your unsaved changes. Nothing is saved or published here.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditorMode('write')}>Continue editing</Button>
                  </div>
                  <ArticleDraftPreview article={draft} mobile={mobilePreview} />
                </TabsContent>
              </Tabs>
              </fieldset>
            </form>
          </Form>
        </motion.div>
      </main>
    </div>
  );
}
