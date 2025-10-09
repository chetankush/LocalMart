'use client';

import { useAppDispatch } from '@/lib/redux/hooks';
import { addToCart, openCart } from '@/lib/redux/slices/cartSlice';
import type { CartItem } from '@/lib/redux/slices/cartSlice';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  stockQuantity: number;
  sku: string | null;
  vendor: {
    id: string;
    businessName: string;
  };
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images.length > 0 ? product.images[0] : undefined,
      quantity: 1,
      stockQuantity: product.stockQuantity,
      vendorId: product.vendor.id,
      vendorName: product.vendor.businessName,
    };

    setIsAdding(true);
    dispatch(addToCart(cartItem));
    dispatch(openCart());

    // Reset button state after animation
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        {product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">📦</span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-bold text-gray-900">
              ₹{product.price.toString()}
            </span>
            {product.compareAtPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ₹{product.compareAtPrice.toString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
          <span>
            Stock: {product.stockQuantity > 0 ? product.stockQuantity : "Out of stock"}
          </span>
          {product.sku && <span>SKU: {product.sku}</span>}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`w-full py-2 rounded-lg font-semibold transition-all ${
            product.stockQuantity > 0
              ? isAdding
                ? 'bg-green-600 text-white cursor-pointer'
                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
          disabled={product.stockQuantity === 0}
        >
          {isAdding
            ? '✓ Added!'
            : product.stockQuantity > 0
            ? 'Add to Cart'
            : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
