import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GroomerListing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  price_unit: string | null;
  location: string | null;
  image_url: string | null;
  provider_id: string;
  provider: {
    first_name: string;
    last_name: string;
    business_name: string | null;
    avatar_url: string | null;
    location: string | null;
  };
  avg_rating: number | null;
  review_count: number;
}

interface UseGroomersOptions {
  locationFilter?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating';
}

export function useGroomers({ locationFilter, sortBy }: UseGroomersOptions = {}) {
  return useQuery({
    queryKey: ['groomers', locationFilter, sortBy],
    queryFn: async (): Promise<GroomerListing[]> => {
      // Fetch grooming listings with provider profiles
      const { data: listings, error } = await supabase
        .from('service_listings')
        .select('id, title, description, price, price_unit, location, image_url, provider_id, profiles!service_listings_provider_id_fkey(first_name, last_name, business_name, avatar_url, location)')
        .eq('category', 'grooming')
        .eq('is_active', true);

      if (error) throw error;
      if (!listings || listings.length === 0) return [];

      // Fetch reviews for all providers
      const providerIds = [...new Set(listings.map(l => l.provider_id))];
      const { data: reviews } = await supabase
        .from('reviews')
        .select('reviewed_id, rating')
        .in('reviewed_id', providerIds);

      // Calculate avg ratings
      const ratingMap = new Map<string, { sum: number; count: number }>();
      reviews?.forEach(r => {
        const existing = ratingMap.get(r.reviewed_id) || { sum: 0, count: 0 };
        existing.sum += r.rating;
        existing.count += 1;
        ratingMap.set(r.reviewed_id, existing);
      });

      let result: GroomerListing[] = listings.map(listing => {
        const profile = listing.profiles as any;
        const ratings = ratingMap.get(listing.provider_id);
        return {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          price_unit: listing.price_unit,
          location: listing.location || profile?.location,
          image_url: listing.image_url,
          provider_id: listing.provider_id,
          provider: {
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            business_name: profile?.business_name,
            avatar_url: profile?.avatar_url,
            location: profile?.location,
          },
          avg_rating: ratings ? Math.round((ratings.sum / ratings.count) * 10) / 10 : null,
          review_count: ratings?.count || 0,
        };
      });

      // Filter by location
      if (locationFilter) {
        const lower = locationFilter.toLowerCase();
        result = result.filter(g =>
          g.location?.toLowerCase().includes(lower) ||
          g.provider.location?.toLowerCase().includes(lower)
        );
      }

      // Sort
      if (sortBy === 'price_asc') {
        result.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      } else if (sortBy === 'price_desc') {
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      } else if (sortBy === 'rating') {
        result.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
      }

      return result;
    },
  });
}
