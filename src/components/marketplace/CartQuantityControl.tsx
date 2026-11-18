import { useEffect, useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cartQuantityLimit } from '@/lib/cart-rules';
import type { CartItem } from '@/hooks/use-cart';

export function CartQuantityControl({ item, checking, failed, onChange }: {
  item: CartItem;
  checking: boolean;
  failed: boolean;
  onChange: (quantity: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(item.quantity));
  const [error, setError] = useState('');
  const limit = cartQuantityLimit(item.stock_quantity);
  const unavailable = item.available === false || limit === 0;
  useEffect(() => { setDraft(String(item.quantity)); setError(''); }, [item.quantity, item.stock_quantity, item.available]);
  function apply() {
    const text = draft.trim();
    const value = Number(text);
    if (unavailable) return;
    if (!/^\d{1,2}$/.test(text) || value < 1 || value > limit) {
      setError(`Enter a whole quantity between 1 and ${limit}. Use Remove to delete an item.`); return;
    }
    if ((checking || failed) && value > item.quantity) {
      setError('Wait for a successful stock check before increasing this quantity.'); return;
    }
    setError(''); setDraft(String(value)); onChange(value);
  }
  const description = unavailable ? 'This item is unavailable. Remove it or check back for stock.'
    : checking ? 'Checking current stock. You can reduce this quantity while we check.'
    : failed ? 'Stock could not be checked. You can reduce this quantity; retry the stock check before increasing it.'
    : item.quantity >= limit ? `Available quantity reached: ${limit} per cart.` : `Up to ${limit} per cart based on the latest stock check.`;
  return <div className="min-w-0 space-y-2">
    <Label htmlFor={id}>Quantity for {item.title}</Label>
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-full border bg-muted/30 p-1">
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label={`Decrease quantity of ${item.title}`} disabled={unavailable || item.quantity <= 1} onClick={() => { setError(''); onChange(item.quantity - 1); }}><Minus className="h-3.5 w-3.5" /></Button>
        <Input id={id} inputMode="numeric" autoComplete="off" className="h-9 w-14 rounded-lg border-0 bg-transparent px-1 text-center" maxLength={3} value={draft} disabled={unavailable} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} aria-invalid={!!error} onChange={event => { setDraft(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); apply(); } }} />
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label={`Increase quantity of ${item.title}`} disabled={unavailable || checking || failed || item.quantity >= limit} onClick={() => { setError(''); onChange(item.quantity + 1); }}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      <Button type="button" variant="outline" size="sm" aria-label={`Update quantity of ${item.title}`} disabled={unavailable || draft === String(item.quantity)} onClick={apply}>Update quantity</Button>
    </div>
    <p id={`${id}-help`} className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
    {error && <p id={`${id}-error`} role="alert" className="max-w-sm text-xs text-destructive">{error}</p>}
  </div>;
}
