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
        className="w-full py-3 rounded-full font-semibold bg-gray-200 text-gray-400 cursor-not-allowed text-sm"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      className={`w-full py-3 rounded-full font-semibold transition-all text-sm cursor-pointer ${
        isAdding
          ? 'bg-green-600 text-white'
          : 'bg-[#FF9933] text-white hover:bg-[#e8872b] active:scale-95'
      }`}
    >
      {isAdding ? '✓ Added' : 'Buy Now'}
    </button>
  );
}
