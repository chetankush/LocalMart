'use client';

import { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from './store';
import { loadCart } from './slices/cartSlice';
import type { CartItem } from './slices/cartSlice';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>();

  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();

    // Load cart from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const cartItems: CartItem[] = JSON.parse(savedCart);
          storeRef.current.dispatch(loadCart(cartItems));
        } catch (error) {
          console.error('Failed to load cart from localStorage:', error);
        }
      }
    }
  }

  // Subscribe to store changes and save to localStorage
  useEffect(() => {
    if (!storeRef.current) return;

    const unsubscribe = storeRef.current.subscribe(() => {
      const state = storeRef.current?.getState();
      if (state) {
        try {
          localStorage.setItem('cart', JSON.stringify(state.cart.items));
        } catch (error) {
          console.error('Failed to save cart to localStorage:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
