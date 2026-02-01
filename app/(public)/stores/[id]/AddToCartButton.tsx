'use client';

import { useAppDispatch } from '@/lib/redux/hooks';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import type { CartItem } from '@/lib/redux/slices/cartSlice';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: any;
  images: any;
  stockQuantity: number;
  vendorId: string;
}

interface AddToCartButtonProps {
  product: Product;
  vendorName: string;
}

export default function AddToCartButton({ product, vendorName }: AddToCartButtonProps) {
  const dispatch = useAppDispatch();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const images = Array.isArray(product.images) ? product.images : [];
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: images.length > 0 ? images[0] as string : undefined,
      quantity: 1,
      stockQuantity: product.stockQuantity,
      vendorId: product.vendorId,
      vendorName: vendorName,
    };

    setIsAdding(true);
    dispatch(addToCart(cartItem));

    // Reset button state after animation
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  if (product.stockQuantity === 0) {
    return (
      <button
        disabled
        className="w-full py-2 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed text-sm"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      className={`w-full py-2 rounded font-bold transition-all text-xs border-2 cursor-pointer ${
        isAdding
          ? 'bg-[#0c831f] border-[#0c831f] text-white'
          : 'bg-white border-[#0c831f] text-[#0c831f] hover:bg-[#0c831f] hover:text-white active:scale-95'
      }`}
    >
      {isAdding ? '✓ ADDED' : 'ADD'}
    </button>
  );
}
