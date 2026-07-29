import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VetClinicListing {
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

interface UseVetClinicsOptions {
  locationFilter?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating';
}

export function useVetClinics({ locationFilter, sortBy }: UseVetClinicsOptions = {}) {
  return useQuery({
    queryKey: ['vet-clinics', locationFilter, sortBy],
    queryFn: async (): Promise<VetClinicListing[]> => {
      const { data: listings, error } = await supabase
        .from('service_listings')
        .select('id, title, description, price, price_unit, location, image_url, provider_id')
        .eq('category', 'vet_clinic')
        .eq('is_active', true);

      if (error) throw error;
      if (!listings || listings.length === 0) return [];

      const providerIds = [...new Set(listings.map(l => l.provider_id))];

      // Fetch public profiles for these providers
      const { data: profiles, error: profileError } = await supabase
        .from('public_profiles')
        .select('*')
        .in('id', providerIds);

      if (profileError) throw profileError;

      const { data: reviews } = await supabase
        .from('reviews')
        .select('reviewed_id, rating')
        .in('reviewed_id', providerIds);

      const ratingMap = new Map<string, { sum: number; count: number }>();
      reviews?.forEach(r => {
        const existing = ratingMap.get(r.reviewed_id) || { sum: 0, count: 0 };
        existing.sum += r.rating;
        existing.count += 1;
        ratingMap.set(r.reviewed_id, existing);
      });

      let result: VetClinicListing[] = listings.map(listing => {
        const profile = profiles?.find(p => p.id === listing.provider_id);
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
            business_name: profile?.business_name || null,
            avatar_url: profile?.avatar_url || null,
            location: profile?.location || null,
          },
          avg_rating: ratings ? Math.round((ratings.sum / ratings.count) * 10) / 10 : null,
          review_count: ratings?.count || 0,
        };
      });

      if (locationFilter) {
        const lower = locationFilter.toLowerCase();
        result = result.filter(c =>
          c.location?.toLowerCase().includes(lower) ||
          c.provider.location?.toLowerCase().includes(lower)
        );
      }

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
