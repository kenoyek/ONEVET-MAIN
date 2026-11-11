import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { cart } = vi.hoisted(() => ({ cart: { items: [] as { id: string; quantity: number }[], addItem: vi.fn() } }));
vi.mock('@/hooks/use-cart', () => ({ useCart: () => cart }));
import { ProductCartAction } from '@/components/marketplace/ProductCartAction';
import { ProductImage } from '@/components/marketplace/ProductImage';
const product = { id: 'feed', title: 'Feed', price: 1500, images: [], seller_id: 'seller', stock_quantity: 2 };
beforeEach(() => { cart.items = []; cart.addItem.mockClear(); });
afterEach(cleanup);
describe('product shopping controls', () => {
  it('adds real stock details and disables additions when the cart reaches stock', () => {
    const { rerender } = render(<ProductCartAction product={product} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(cart.addItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'feed', stock_quantity: 2, quantity: 1, price: 1500 }));
    cart.items = [{ id: 'feed', quantity: 1 }]; rerender(<ProductCartAction product={product} />);
    expect(screen.getByRole('button', { name: 'Add another' })).toBeEnabled();
    cart.items = [{ id: 'feed', quantity: 2 }]; rerender(<ProductCartAction product={product} />);
    expect(screen.getByRole('button', { name: 'Stock limit reached' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('2 in your cart');
  });
  it('blocks missing stock and handles a stock reduction below the existing quantity', () => {
    const { rerender } = render(<ProductCartAction product={{ ...product, stock_quantity: null }} />);
    expect(screen.getByRole('button', { name: 'Out of Stock' })).toBeDisabled();
    cart.items = [{ id: 'feed', quantity: 3 }]; rerender(<ProductCartAction product={product} />);
    expect(screen.getByRole('button', { name: 'Stock limit reached' })).toBeDisabled();
  });
  it('replaces failed images and retries a different image source', () => {
    const { rerender } = render(<ProductImage src="https://example.invalid/broken.webp" title="Feed" category="Livestock" />);
    fireEvent.error(screen.getByRole('img', { name: 'Feed' }));
    expect(screen.getByRole('img', { name: 'Feed product image fallback' })).toBeInTheDocument();
    rerender(<ProductImage src="https://example.invalid/new.webp" title="Feed" />);
    expect(screen.getByRole('img', { name: 'Feed' })).toHaveAttribute('src', 'https://example.invalid/new.webp');
  });
});
