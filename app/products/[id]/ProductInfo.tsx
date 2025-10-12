"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import type { CartItem } from "@/lib/redux/slices/cartSlice";

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: any;
    compareAtPrice: any;
    stockQuantity: number;
    sku: string | null;
    weight: any;
    dimensions: any;
    averageRating: any;
    reviewCount: number;
    category: {
      id: string;
      name: string;
      slug: string;
    };
    images: string[];
  };
  vendor: {
    id: string;
    businessName: string;
    storeLogo: string | null;
    city: string;
    state: string;
    averageRating: any;
    reviewCount: number;
  };
}

export default function ProductInfo({ product, vendor }: ProductInfoProps) {
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const price = Number(product.price);
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: price,
      image: product.images.length > 0 ? product.images[0] : undefined,
      quantity: quantity,
      stockQuantity: product.stockQuantity,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
    };

    setIsAdding(true);
    dispatch(addToCart(cartItem));

    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  return (
    <div className="space-y-5">
      {/* Product Name */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2">
          {product.name}
        </h1>

        {/* Category Badge */}
        <Link
          href={`/categories/${product.category.slug}`}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          {product.category.name}
        </Link>
      </div>

      {/* Rating */}
      {product.averageRating && product.reviewCount > 0 ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(Number(product.averageRating))
                    ? "text-yellow-400"
                    : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-lg font-semibold text-gray-900">
              {Number(product.averageRating).toFixed(1)}
            </span>
          </div>
          <a
            href="#reviews"
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
          </a>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No reviews yet</div>
      )}

      <div className="border-t border-gray-200"></div>

      {/* Price */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-gray-900">
            ₹{price.toFixed(0)}
          </span>
          {compareAtPrice && discount > 0 && (
            <>
              <span className="text-xl text-gray-500 line-through">
                ₹{compareAtPrice.toFixed(0)}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-100 text-green-800 text-sm font-semibold">
                {discount}% OFF
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-600">Inclusive of all taxes</p>
      </div>

      {/* Stock Status */}
      <div>
        {product.stockQuantity > 0 ? (
          <div className="flex items-center text-green-700">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">
              {product.stockQuantity > 20
                ? "In Stock"
                : `Only ${product.stockQuantity} left in stock`}
            </span>
          </div>
        ) : (
          <div className="flex items-center text-red-600">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200"></div>

      {/* Quantity Selector */}
      {product.stockQuantity > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              disabled={quantity <= 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              min="1"
              max={product.stockQuantity}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.min(Math.max(1, val), product.stockQuantity));
              }}
              className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              disabled={quantity >= product.stockQuantity}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={product.stockQuantity === 0 || isAdding}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
          product.stockQuantity > 0
            ? isAdding
              ? "bg-green-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
            : "bg-gray-400 text-white cursor-not-allowed"
        }`}
      >
        {isAdding ? (
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Added to Cart!
          </span>
        ) : product.stockQuantity > 0 ? (
          "Add to Cart"
        ) : (
          "Out of Stock"
        )}
      </button>

      <div className="border-t border-gray-200"></div>

      {/* Vendor Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Sold by</h3>
        <Link
          href={`/stores/${vendor.id}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
            {vendor.storeLogo ? (
              <Image
                src={vendor.storeLogo}
                alt={vendor.businessName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="text-xl">🏪</div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {vendor.businessName}
            </p>
            <p className="text-sm text-gray-600">
              {vendor.city}, {vendor.state}
            </p>
            {vendor.averageRating && vendor.reviewCount > 0 && (
              <div className="flex items-center mt-1">
                <span className="text-sm font-medium text-gray-900">
                  {Number(vendor.averageRating).toFixed(1)}
                </span>
                <svg className="w-4 h-4 ml-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-sm text-gray-600">
                  ({vendor.reviewCount})
                </span>
              </div>
            )}
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Delivery Info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <div>
            <p className="font-semibold text-gray-900">Local Delivery Available</p>
            <p className="text-sm text-gray-600 mt-1">
              This product will be delivered by {vendor.businessName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
