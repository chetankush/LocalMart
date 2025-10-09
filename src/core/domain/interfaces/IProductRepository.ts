/**
 * Product Repository Interface
 * Defines contract for product data access
 */

import { Product } from '../entities/Product';
import { Result } from '@/shared/types/result';
import { PaginatedResult, PaginationOptions } from './IUserRepository';

export interface ProductFilters {
  vendorId?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  search?: string; // Full-text search on name and description
  minPrice?: number;
  maxPrice?: number;
  deliveryZoneId?: string; // Filter by zone availability
}

export interface ProductSortOptions {
  field: 'name' | 'price' | 'createdAt' | 'stockQuantity';
  order: 'asc' | 'desc';
}

export interface IProductRepository {
  /**
   * Find product by ID
   */
  findById(id: string): Promise<Result<Product | null>>;

  /**
   * Find product by slug
   */
  findBySlug(slug: string): Promise<Result<Product | null>>;

  /**
   * Find product by SKU
   */
  findBySku(sku: string): Promise<Result<Product | null>>;

  /**
   * Find all products with filters, sorting, and pagination
   */
  findAll(
    filters: ProductFilters,
    sort: ProductSortOptions,
    pagination: PaginationOptions
  ): Promise<Result<PaginatedResult<Product>>>;

  /**
   * Find products by vendor
   */
  findByVendor(vendorId: string, pagination: PaginationOptions): Promise<Result<PaginatedResult<Product>>>;

  /**
   * Find products by category
   */
  findByCategory(categoryId: string, pagination: PaginationOptions): Promise<Result<PaginatedResult<Product>>>;

  /**
   * Find featured products
   */
  findFeatured(pagination: PaginationOptions): Promise<Result<PaginatedResult<Product>>>;

  /**
   * Find low stock products for a vendor
   */
  findLowStock(vendorId: string): Promise<Result<Product[]>>;

  /**
   * Search products (full-text search)
   */
  search(query: string, pagination: PaginationOptions): Promise<Result<PaginatedResult<Product>>>;

  /**
   * Create a new product
   */
  create(product: Product): Promise<Result<Product>>;

  /**
   * Update existing product
   */
  update(product: Product): Promise<Result<Product>>;

  /**
   * Delete product (soft delete)
   */
  delete(id: string): Promise<Result<void>>;

  /**
   * Check if product exists by slug
   */
  existsBySlug(slug: string): Promise<Result<boolean>>;

  /**
   * Check if product exists by SKU
   */
  existsBySku(sku: string): Promise<Result<boolean>>;

  /**
   * Get product count by vendor
   */
  countByVendor(vendorId: string): Promise<Result<number>>;

  /**
   * Get total stock value for vendor
   */
  getTotalStockValue(vendorId: string): Promise<Result<number>>;

  /**
   * Bulk update stock (for order processing)
   */
  bulkUpdateStock(updates: Array<{ productId: string; quantity: number }>): Promise<Result<void>>;
}
