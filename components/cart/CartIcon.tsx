'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import { selectCartItemsCount } from '@/lib/redux/slices/cartSlice';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CartIcon() {
  const itemsCount = useAppSelector(selectCartItemsCount);

  return (
    <Link
      href="/cart"
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Shopping cart"
    >
      <ShoppingCart className="w-6 h-6" />
      {itemsCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemsCount > 99 ? '99+' : itemsCount}
        </span>
      )}
    </Link>
  );
}
