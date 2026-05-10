/**
 * Serialization Utilities
 * Helper functions to convert Prisma Decimal types to numbers for client components
 */

import { Prisma } from "@prisma/client";

/**
 * Convert Decimal to number safely
 */
export function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

/**
 * Serialize product data for client components
 * Converts all Decimal fields to numbers
 */
export function serializeProduct<T extends {
  price?: any;
  compareAtPrice?: any;
  weight?: any;
  averageRating?: any;
  [key: string]: any;
}>(product: T) {
  return {
    ...product,
    price: product.price !== undefined ? Number(product.price) : undefined,
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    weight: product.weight ? Number(product.weight) : null,
    averageRating: product.averageRating ? Number(product.averageRating) : null,
  };
}

/**
 * Serialize vendor data for client components
 * Converts all Decimal fields to numbers
 * NOTE: If vendor has nested products array, exclude it before calling this function
 * or use serializeVendorWithProducts() instead
 */
export function serializeVendor<T extends {
  averageRating?: any;
  minOrderAmount?: any;
  maxDeliveryDistance?: any;
  commissionRate?: any;
  [key: string]: any;
}>(vendor: T) {
  return {
    ...vendor,
    averageRating: vendor.averageRating ? Number(vendor.averageRating) : null,
    minOrderAmount: vendor.minOrderAmount ? Number(vendor.minOrderAmount) : null,
    maxDeliveryDistance: vendor.maxDeliveryDistance ? Number(vendor.maxDeliveryDistance) : null,
    commissionRate: vendor.commissionRate ? Number(vendor.commissionRate) : null,
  };
}

/**
 * Serialize order data for client components
 * Converts all Decimal fields to numbers
 */
export function serializeOrder<T extends {
  totalAmount?: any;
  subtotal?: any;
  deliveryFee?: any;
  tax?: any;
  discount?: any;
  [key: string]: any;
}>(order: T) {
  return {
    ...order,
    totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
    subtotal: order.subtotal ? Number(order.subtotal) : null,
    deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : null,
    tax: order.tax ? Number(order.tax) : null,
    discount: order.discount ? Number(order.discount) : null,
  };
}

/**
 * Serialize order item data for client components
 */
export function serializeOrderItem<T extends {
  price?: any;
  total?: any;
  [key: string]: any;
}>(item: T) {
  return {
    ...item,
    price: item.price ? Number(item.price) : null,
    total: item.total ? Number(item.total) : null,
  };
}

/**
 * Serialize array of products
 */
export function serializeProducts<T extends {
  price?: any;
  compareAtPrice?: any;
  weight?: any;
  averageRating?: any;
  [key: string]: any;
}>(products: T[]) {
  return products.map(serializeProduct);
}

/**
 * Serialize array of vendors
 */
export function serializeVendors<T extends {
  averageRating?: any;
  minOrderAmount?: any;
  maxDeliveryDistance?: any;
  commissionRate?: any;
  [key: string]: any;
}>(vendors: T[]) {
  return vendors.map(serializeVendor);
}

/**
 * Serialize array of orders
 */
export function serializeOrders<T extends {
  totalAmount?: any;
  subtotal?: any;
  deliveryFee?: any;
  tax?: any;
  discount?: any;
  [key: string]: any;
}>(orders: T[]) {
  return orders.map(serializeOrder);
}

/**
 * Generic serializer for any object with Decimal fields
 * Recursively converts all Decimal instances to numbers
 */
export function serializeDecimalFields<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => serializeDecimalFields(item)) as any;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && value.constructor.name === 'Decimal') {
        result[key] = Number(value);
      } else if (value && typeof value === 'object') {
        result[key] = serializeDecimalFields(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}

/**
 * Serialize vendor with nested products
 * Handles vendors that include products array
 */
export function serializeVendorWithProducts<T extends {
  averageRating?: any;
  minOrderAmount?: any;
  maxDeliveryDistance?: any;
  commissionRate?: any;
  products?: any[];
  [key: string]: any;
}>(vendor: T) {
  const { products, ...vendorWithoutProducts } = vendor;

  return {
    ...serializeVendor(vendorWithoutProducts),
    ...(products && { products: serializeProducts(products) }),
  };
}
