import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { cartQuantityLimit } from '@/lib/cart-rules';

type Product = { id: string; title: string; price: number; images?: string[] | null; seller_id: string; stock_quantity: number | null };
export function ProductCartAction({ product }: { product: Product }) {
  const { items, addItem } = useCart();
  const quantity = items.find(item => item.id === product.id)?.quantity ?? 0;
  const limit = cartQuantityLimit(product.stock_quantity ?? 0);
  const full = quantity >= limit;
  return <div className="w-full space-y-2">
    <Button className="w-full gap-2 rounded-full" disabled={limit === 0 || full} onClick={() => addItem({ id: product.id, title: product.title, price: product.price, image: product.images?.[0] || '/product-fallback.svg', seller_id: product.seller_id, quantity: 1, stock_quantity: product.stock_quantity ?? 0, available: true })}>
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />{limit === 0 ? 'Out of Stock' : full ? 'Stock limit reached' : quantity ? 'Add another' : 'Add to Cart'}
    </Button>
    {quantity > 0 && <p role="status" className="text-center text-xs text-muted-foreground">{quantity} in your cart{full && limit > 0 ? ' · available quantity reached' : ''}</p>}
  </div>;
}
