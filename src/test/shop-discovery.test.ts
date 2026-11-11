import { describe, expect, it } from 'vitest';
import { discoverProducts, shopFilters } from '@/lib/shop-discovery';
const products = [
  { title: 'Poultry feed', description: 'Layer nutrition', price: 2500, stock_quantity: 5 },
  { title: 'Pet bowl', description: null, price: 500, stock_quantity: 0 },
  { title: 'Cat food', description: 'Daily nutrition', price: 1200, stock_quantity: 2 },
];
describe('shop discovery', () => {
  it('matches all search words across titles and descriptions and ignores extra spaces', () => {
    expect(discoverProducts(products, shopFilters(new URLSearchParams('q=+POULTRY++nutrition+'))).map(p => p.title)).toEqual(['Poultry feed']);
    expect(discoverProducts(products, shopFilters(new URLSearchParams('q=dog')))).toEqual([]);
  });
  it('combines stock filtering and numeric price sorting without changing the source order', () => {
    expect(discoverProducts(products, shopFilters(new URLSearchParams('stock=available&sort=price-low'))).map(p => p.price)).toEqual([1200, 2500]);
    expect(discoverProducts(products, shopFilters(new URLSearchParams('sort=price-high'))).map(p => p.price)).toEqual([2500, 1200, 500]);
    expect(products[0]!.title).toBe('Poultry feed');
  });
  it('supports alphabetical sorting and keeps newest query order by default', () => {
    expect(discoverProducts(products, shopFilters(new URLSearchParams('sort=name'))).map(p => p.title)).toEqual(['Cat food', 'Pet bowl', 'Poultry feed']);
    expect(discoverProducts(products, shopFilters(new URLSearchParams()))).toEqual(products);
  });
  it('ignores invalid categories and sorting values and bounds shared searches', () => {
    expect(shopFilters(new URLSearchParams('category=unknown&sort=script&stock=yes'))).toMatchObject({category: 'All', sort: 'newest', inStock: false});
    expect(shopFilters(new URLSearchParams({q: 'a'.repeat(500)})).search).toHaveLength(200);
    expect(shopFilters(new URLSearchParams('category=Livestock&stock=available'))).toMatchObject({category: 'Livestock', inStock: true});
  });
});
