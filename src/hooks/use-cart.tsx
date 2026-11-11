import { useCallback } from 'react';
import { cartQuantityLimit, validCartQuantity } from '@/lib/cart-rules';
import { useAuth } from '@/lib/auth-context';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  seller_id: string;
  stock_quantity?: number;
  available?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  refreshItems: (listings: { id:string; title:string; price:number; images:string[]|null; seller_id:string; stock_quantity:number|null }[]) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const identity = loading ? 'pending' : (user?.id ?? 'guest');
  const storageKey = loading ? null : `1vet-cart:v2:${identity}`;
  return (
    <ScopedCart key={identity} storageKey={storageKey}>
      {children}
    </ScopedCart>
  );
};

function readCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CartItem => {
      if (!item || typeof item !== 'object') return false;
      return (
        ['id', 'title', 'image', 'seller_id'].every(
          (k) => typeof item[k] === 'string',
        ) &&
        typeof item.price === 'number' &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        validCartQuantity(item.quantity) &&
        (item.stock_quantity === undefined || (Number.isSafeInteger(item.stock_quantity) && item.stock_quantity >= 0)) &&
        (item.available === undefined || typeof item.available === 'boolean')
      );
    });
  } catch {
    return [];
  }
}

const ScopedCart = ({
  children,
  storageKey,
}: {
  children: ReactNode;
  storageKey: string | null;
}) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined' || !storageKey) return [];
    try {
      return readCart(localStorage.getItem(storageKey));
    } catch (error) {
      console.error('Failed to parse cart from localStorage', error);
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage', error);
    }
  }, [items, storageKey]);

  const addItem = (newItem: CartItem) => {
    if (!Number.isFinite(newItem.price) || newItem.price < 0 || cartQuantityLimit(newItem.stock_quantity) === 0 || newItem.available === false) { toast.error('This product is unavailable.'); return; }
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === newItem.id);
      if (existingItem) {
        if (existingItem.quantity >= cartQuantityLimit(newItem.stock_quantity ?? existingItem.stock_quantity)) { toast.info('You have reached the available quantity for this item.'); return prevItems; }
        toast.info(`Increased quantity of ${newItem.title} in cart`);
        return prevItems.map((item) =>
          item.id === newItem.id
            ? { ...item, ...newItem, available: true, quantity: item.quantity + 1 }
            : item,
        );
      }
      toast.success(`${newItem.title} added to cart`);
      return [...prevItems, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => {
      const itemToRemove = prevItems.find((i) => i.id === id);
      if (itemToRemove) {
        toast.info(`${itemToRemove.title} removed from cart`);
      }
      return prevItems.filter((item) => item.id !== id);
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity)) return;
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    if (!validCartQuantity(quantity)) return;
    setItems((prevItems) => prevItems.map(item => item.id === id && item.available !== false && quantity <= cartQuantityLimit(item.stock_quantity) ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setItems([]);
    try {
      if (storageKey) localStorage.removeItem(storageKey);
    } catch {
      /* Storage can be disabled. */
    }
  };

  const refreshItems = useCallback((listings: { id:string; title:string; price:number; images:string[]|null; seller_id:string; stock_quantity:number|null }[]) => {
    setItems(previous => {
      const next = previous.map(item => {
        const listing = listings.find(product => product.id === item.id);
        if (!listing || !Number.isFinite(listing.price) || listing.price < 0 || cartQuantityLimit(listing.stock_quantity ?? 0) === 0) return { ...item, available: false, stock_quantity: 0 };
        return { ...item, title: listing.title, price: listing.price, seller_id: listing.seller_id, image: listing.images?.[0] || '/product-fallback.svg', stock_quantity: listing.stock_quantity ?? 0, available: true, quantity: Math.min(item.quantity, cartQuantityLimit(listing.stock_quantity ?? 0)) };
      });
      return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce(
    (acc, item) => acc + (item.available === false ? 0 : Math.round(item.price * 100) * item.quantity),
    0,
  ) / 100;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshItems,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
