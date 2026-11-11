import type { CartItem } from '@/hooks/use-cart';
import { cartQuantityLimit } from '@/lib/cart-rules';
type Listing = { id: string; price: number; stock_quantity: number | null };
export function cartChanges(items: readonly CartItem[], listings: readonly Listing[]): string[] {
  return items.flatMap(item => {
    const current = listings.find(listing => listing.id === item.id);
    const limit = current ? cartQuantityLimit(current.stock_quantity ?? 0) : 0;
    if (!current || !Number.isFinite(current.price) || current.price < 0 || !limit) return item.available === false ? [] : [`${item.title} is currently unavailable and is excluded from the subtotal.`];
    const messages: string[] = [];
    if (item.available === false) messages.push(`${item.title} is available again.`);
    if (Math.round(current.price * 100) !== Math.round(item.price * 100)) messages.push(`${item.title}: unit price changed from ₦${item.price.toLocaleString('en-NG', {minimumFractionDigits:2})} to ₦${current.price.toLocaleString('en-NG', {minimumFractionDigits:2})}.`);
    if (item.quantity > limit) messages.push(`${item.title}: quantity reduced from ${item.quantity} to ${limit} to match current stock.`);
    return messages;
  });
}
