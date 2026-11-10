import { articlePublicationState } from '@/lib/article-publication';
import { PageHeading } from '@/components/layout/PageHeading';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, FileText, Search, Filter, Loader2, Plus,
  Edit, Trash2, Eye, EyeOff, MoreVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  is_published: boolean | null;
  view_count: number | null;
  created_at: string;
  published_at: string | null;
}

export default function AdminArticles() {
  const navigate = useNavigate();
  const publicationLocks = useRef(new Set<string>());
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, category, is_published, view_count, created_at, published_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublish = async (article: Article) => {
    if (publicationLocks.current.has(article.id)) return;
    publicationLocks.current.add(article.id);
    setPublishingIds(new Set(publicationLocks.current));
    try {
      const { data, error } = await supabase
        .from('articles')
        .update(articlePublicationState(!article.is_published, article.published_at))
        .eq('id', article.id)
        .select('id, is_published, published_at')
        .single();

      if (error) throw error;

      toast.success(article.is_published ? 'Article unpublished' : 'Article published');
      setArticles(current => current.map(row => row.id === data.id ? { ...row, ...data } : row));
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Failed to update article');
    } finally {
      publicationLocks.current.delete(article.id);
      setPublishingIds(new Set(publicationLocks.current));
    }
  };

  const handleDelete = async () => {
    if (!deleteArticleId) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', deleteArticleId);

      if (error) throw error;

      toast.success('Article deleted');
      setDeleteArticleId(null);
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && article.is_published) ||
      (statusFilter === 'draft' && !article.is_published);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container-wide py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <PageHeading size="display" className="" title={<> Article Management </>}/>
                <p className="text-muted-foreground mt-1">
                  Create and manage educational content
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/articles/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Articles</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Articles Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Articles ({filteredArticles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No articles found</p>
                  <Button onClick={() => navigate('/admin/articles/new')}>
                    Create your first article
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium line-clamp-1">{article.title}</p>
                              <p className="text-sm text-muted-foreground">/articles/{article.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{article.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={article.is_published ? 'default' : 'secondary'}>
                              {article.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell>{article.view_count == null ? '—' : article.view_count.toLocaleString()}</TableCell>
                          <TableCell>
                            {format(new Date(article.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={publishingIds.has(article.id)} aria-label={`Actions for ${article.title}`}>
                                  {publishingIds.has(article.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => togglePublish(article)}>
                                  {article.is_published ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Unpublish
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Publish
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteArticleId(article.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={() => setDeleteArticleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
