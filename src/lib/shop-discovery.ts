export const shopCategories = ['All', 'Pet Food', 'Pet Health', 'Pet Supplies', 'Livestock', 'Accessories'] as const;
export const shopSorts = ['newest', 'price-low', 'price-high', 'name'] as const;
type Product = { title: string; description?: string | null; price: number; stock_quantity: number | null };
export function shopFilters(params: URLSearchParams) {
  const category = params.get('category') || 'All';
  const sort = params.get('sort') || 'newest';
  return {
    search: (params.get('q') || '').slice(0, 200),
    category: shopCategories.includes(category as typeof shopCategories[number]) ? category : 'All',
    sort: shopSorts.includes(sort as typeof shopSorts[number]) ? sort : 'newest',
    inStock: params.get('stock') === 'available',
  };
}
export function discoverProducts<T extends Product>(products: readonly T[], filters: ReturnType<typeof shopFilters>): T[] {
  const words = filters.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const result = products.filter(item => (!filters.inStock || (item.stock_quantity ?? 0) > 0) && words.every(word => `${item.title} ${item.description || ''}`.toLocaleLowerCase().includes(word)));
  if (filters.sort === 'price-low') result.sort((a, b) => a.price - b.price || a.title.localeCompare(b.title));
  if (filters.sort === 'price-high') result.sort((a, b) => b.price - a.price || a.title.localeCompare(b.title));
  if (filters.sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
  return result;
}
