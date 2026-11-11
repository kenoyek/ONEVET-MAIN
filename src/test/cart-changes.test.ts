import { describe, expect, it } from 'vitest';
import { cartChanges } from '@/lib/cart-changes';
const item = { id:'feed', title:'Feed', price:1000, quantity:4, image:'', seller_id:'seller', available:true };
describe('cart update explanations', () => {
  it('explains price changes and quantity reductions together', () => {
    expect(cartChanges([item], [{id:'feed',price:1250,stock_quantity:2}])).toEqual([
      'Feed: unit price changed from ₦1,000.00 to ₦1,250.00.',
      'Feed: quantity reduced from 4 to 2 to match current stock.',
    ]);
  });
  it('explains unavailable items once and recognizes restored availability', () => {
    expect(cartChanges([item], [])).toEqual(['Feed is currently unavailable and is excluded from the subtotal.']);
    expect(cartChanges([{...item,available:false}], [])).toEqual([]);
    expect(cartChanges([{...item,available:false}], [{id:'feed',price:1000,stock_quantity:5}])).toEqual(['Feed is available again.']);
  });
  it('treats invalid prices and missing stock as unavailable without inventing totals', () => {
    expect(cartChanges([item], [{id:'feed',price:NaN,stock_quantity:5}])).toHaveLength(1);
    expect(cartChanges([item], [{id:'feed',price:1000,stock_quantity:null}])).toHaveLength(1);
    expect(cartChanges([item], [{id:'feed',price:1000,stock_quantity:5}])).toEqual([]);
  });
});
