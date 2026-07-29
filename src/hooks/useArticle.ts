import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ArticleRecord {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  category?: string | null;
  image_url?: string | null;
  author_id?: string | null;
  published: boolean;
  published_at?: string | null;
  created_at: string;
}

export function useArticle(idOrSlug: string | undefined) {
  const query = useQuery({
    queryKey: ['article', idOrSlug],
    queryFn: async (): Promise<ArticleRecord | null> => {
      if (!idOrSlug) return null;
      let queryBuilder = supabase.from('articles').select('*');

      if (idOrSlug.includes('-')) {
        queryBuilder = queryBuilder.eq('slug', idOrSlug);
      } else {
        queryBuilder = queryBuilder.eq('id', idOrSlug);
      }

      const { data, error } = await queryBuilder.maybeSingle();
      if (error) throw error;
      return (data || null) as ArticleRecord | null;
    },
    enabled: Boolean(idOrSlug),
  });

  return {
    article: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
