import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string; // product id
  /** The size, for items that come in sizes */
  variantId?: string;
  variantLabel?: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  stockQuantity: number;
  vendorId: string;
  vendorName: string;
}

/**
 * One cart line per item and size: "productId", or "productId:sizeId".
 * Every action and selector below takes this key (for items without sizes
 * it's just the product id, so old carts keep working).
 */
export const cartKey = (i: { id: string; variantId?: string | null }) => (i.variantId ? `${i.id}:${i.variantId}` : i.id);

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  isOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const key = cartKey(action.payload);
      const existingItem = state.items.find(item => cartKey(item) === key);

      if (existingItem) {
        // Check if adding one more would exceed stock
        if (existingItem.quantity < existingItem.stockQuantity) {
          existingItem.quantity += 1;
        }
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => cartKey(item) !== action.payload);
    },

    // id: the line's cartKey
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => cartKey(item) === action.payload.id);
      if (item) {
        // Ensure quantity doesn't exceed stock and is at least 1
        item.quantity = Math.min(
          Math.max(action.payload.quantity, 1),
          item.stockQuantity
        );
      }
    },

    incrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => cartKey(item) === action.payload);
      if (item && item.quantity < item.stockQuantity) {
        item.quantity += 1;
      }
    },

    decrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => cartKey(item) === action.payload);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          // Remove item if quantity becomes 0
          state.items = state.items.filter(i => cartKey(i) !== action.payload);
        }
      }
    },

    clearCart: (state) => {
      state.items = [];
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },

    openCart: (state) => {
      state.isOpen = true;
    },

    closeCart: (state) => {
      state.isOpen = false;
    },

    // Load cart from localStorage or database
    loadCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },

    // Refresh prices and stock from a server quote (quantities are left alone;
    // the cart shows stock problems and lets the customer decide)
    syncFromQuote: (
      state,
      action: PayloadAction<{ id: string; key?: string; unitPrice: number; stockQuantity: number }[]>
    ) => {
      for (const fresh of action.payload) {
        const item = state.items.find((i) => cartKey(i) === (fresh.key ?? fresh.id));
        if (!item) continue;
        if (item.price !== fresh.unitPrice) item.price = fresh.unitPrice;
        if (item.stockQuantity !== fresh.stockQuantity) item.stockQuantity = fresh.stockQuantity;
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
  loadCart,
  syncFromQuote,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
export const selectCartItemsCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0);
export const selectIsCartOpen = (state: { cart: CartState }) => state.cart.isOpen;
/** key: the line's cartKey (a product id for items without sizes) */
export const selectCartItemById = (state: { cart: CartState }, key: string) =>
  state.cart.items.find(item => cartKey(item) === key);
/** Pieces of an item in the cart, across all its sizes */
export const selectProductQuantity = (state: { cart: CartState }, productId: string) =>
  state.cart.items.filter(item => item.id === productId).reduce((n, item) => n + item.quantity, 0);
