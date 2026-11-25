import { supabase } from '@/integrations/supabase/client';

export type BoardingListing = { name: string; slug: string; description: string; email: string; city: string; state: string };

export async function listBoardingFacilities(city: string, cursor?: string) {
  const { data, error } = await supabase.rpc('list_public_boarding_facilities', {
    city_query: city || null, after_slug: cursor ?? null,
  });
  if (error) throw error;
  if (!Array.isArray(data)) throw Error('Boarding directory unavailable');
  const listings = data as BoardingListing[];
  return { facilities: listings.slice(0, 25), hasMore: listings.length > 25 };
}

export async function setBoardingListing(providerId: string, published: boolean) {
  const { data, error } = await supabase.rpc('set_boarding_listing', {
    provider_uuid: providerId, publish: published,
  });
  if (error) throw error;
  if (data !== published) throw Error('Listing update not confirmed');
}

export async function getBoardingFacility(slug: string) {
  const { data, error } = await supabase.rpc('get_public_boarding_facility', { facility_slug: slug });
  if (error) throw error;
  return data as BoardingListing | null;
}
