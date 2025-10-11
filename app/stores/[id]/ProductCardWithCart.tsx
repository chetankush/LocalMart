'use client';

import { useAppDispatch } from '@/lib/redux/hooks';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import type { CartItem } from '@/lib/redux/slices/cartSlice';
import { useState } from 'react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: any;
  images: any;
  stockQuantity: number;
  vendorId: string;
}

interface ProductCardWithCartProps {
  product: Product;
  vendorName: string;
}

export default function ProductCardWithCart({ product, vendorName }: ProductCardWithCartProps) {
  const dispatch = useAppDispatch();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
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
    // Mini cart popup will show automatically via CartIcon component

    // Reset button state after animation
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {Array.isArray(product.images) && product.images.length > 0 ? (
          <Image
            src={product.images[0] as string}
            alt={product.name}
            width={200}
            height={200}
            className="object-contain w-full h-full transition-transform duration-300"
          />
        ) : (
          <div className="text-4xl">📦</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-bold text-gray-900">
            ₹{Number(product.price).toFixed(0)}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.stockQuantity} left
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
            product.stockQuantity > 0
              ? isAdding
                ? 'bg-green-600 text-white cursor-pointer'
                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
          disabled={product.stockQuantity === 0}
        >
          {isAdding
            ? '✓ Added to Cart!'
            : product.stockQuantity > 0
            ? 'Add to Cart'
            : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
