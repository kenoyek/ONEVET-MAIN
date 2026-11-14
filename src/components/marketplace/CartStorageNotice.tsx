import {useCart} from '@/hooks/use-cart';
import {Button} from '@/components/ui/button';

export function CartStorageNotice() {
  const {storageError,retryStorage}=useCart();
  if(!storageError)return null;
  return <section role="alert" className="my-6 rounded-2xl border border-destructive/30 bg-card p-5 text-left">
    <h2 className="font-semibold">Your cart could not be saved in this browser</h2>
    <p className="mt-2 text-sm text-muted-foreground">Your current items are available while this page stays open. Reloading, leaving or signing in may lose your latest changes. Allow browser storage or free some space, then retry before continuing.</p>
    <Button variant="outline" className="mt-4" onClick={retryStorage}>Retry saving cart</Button>
  </section>;
}
