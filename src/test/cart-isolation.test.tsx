import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from '@/hooks/use-cart';
const auth = vi.hoisted(() => ({
  user: { id: 'account-a' } as { id: string } | null,
  loading: false,
}));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => auth }));
function Probe() {
  const cart = useCart();
  return (
    <>
      <p data-testid="cart">
        {cart.items.map((i) => i.title).join(',')}|{cart.totalPrice}
      </p>
      <button
        onClick={() =>
          cart.addItem({
            id: 'one',
            title: 'Animal feed',
            price: 200,
            image: '',
            quantity: 1,
            seller_id: 'seller',
          })
        }
      >
        Add
      </button>
    </>
  );
}
const view = () => (
  <CartProvider>
    <Probe />
  </CartProvider>
);
beforeEach(() => {
  localStorage.clear();
  auth.user = { id: 'account-a' };
  auth.loading = false;
});
afterEach(cleanup);
describe('Account-scoped cart storage', () => {
  it('never carries another account’s cart through account switches or logout', () => {
    const { rerender } = render(view());
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByTestId('cart')).toHaveTextContent('Animal feed|200');
    auth.user = { id: 'account-b' };
    rerender(view());
    expect(screen.getByTestId('cart').textContent).toBe('|0');
    auth.user = null;
    rerender(view());
    expect(screen.getByTestId('cart').textContent).toBe('|0');
    auth.user = { id: 'account-a' };
    rerender(view());
    expect(screen.getByTestId('cart')).toHaveTextContent('Animal feed|200');
  });
  it('does not assign the old shared cart to whichever user signs in next', () => {
    localStorage.setItem(
      '1vet-cart',
      JSON.stringify([
        {
          id: 'old',
          title: 'Private old item',
          price: 10,
          quantity: 1,
          image: '',
          seller_id: 's',
        },
      ]),
    );
    render(view());
    expect(screen.getByTestId('cart').textContent).toBe('|0');
    expect(localStorage.getItem('1vet-cart')).toContain('Private old item');
  });
  it('ignores malformed persisted data without breaking totals', () => {
    localStorage.setItem(
      '1vet-cart:v2:account-a',
      JSON.stringify([
        { id: 'bad', title: 'Broken item', price: 'NaN', quantity: -5 },
      ]),
    );
    render(view());
    expect(screen.getByTestId('cart').textContent).toBe('|0');
  });
});
