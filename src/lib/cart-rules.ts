export const CART_QUANTITY_LIMIT = 99;
export function cartQuantityLimit(stock?: number | null) {
  return stock == null ? CART_QUANTITY_LIMIT : Math.min(CART_QUANTITY_LIMIT, Math.max(0, Math.floor(Number.isFinite(stock) ? stock : 0)));
}
export function validCartQuantity(quantity: number) { return Number.isSafeInteger(quantity) && quantity > 0 && quantity <= CART_QUANTITY_LIMIT; }
