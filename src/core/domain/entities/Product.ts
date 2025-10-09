/**
 * Product Entity
 * Represents a product in the marketplace with inventory and delivery details
 */

import { Entity } from './base/Entity';
import { Result } from '@/shared/types/result';
import { Money } from '../value-objects/Money';

interface ProductDimensions {
  length: number; // in cm
  width: number;
  height: number;
}

interface ProductProps {
  vendorId: string;
  categoryId: string;

  name: string;
  slug: string;
  description: string;
  images: string[];

  // Pricing
  price: Money;
  compareAtPrice?: Money; // Original price for discounts
  cost?: Money; // Vendor's cost

  // Inventory
  sku?: string;
  stockQuantity: number;
  lowStockThreshold: number;

  // Product Details
  weight?: number; // in kg
  dimensions?: ProductDimensions;

  // Delivery Specific
  requiresSpecialHandling: boolean;
  handlingInstructions?: string;
  areaWiseAvailability?: Map<string, boolean>; // zoneId -> available

  // Status
  isActive: boolean;
  isFeatured: boolean;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  createdAt: Date;
  updatedAt: Date;
}

export class Product extends Entity<ProductProps> {
  private constructor(props: ProductProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method to create a Product entity
   */
  public static create(props: ProductProps, id?: string): Result<Product> {
    // Validate product name
    if (!props.name || props.name.trim().length < 2) {
      return Result.fail<Product>('Product name must be at least 2 characters');
    }

    // Validate slug
    if (!props.slug || props.slug.trim().length === 0) {
      return Result.fail<Product>('Product slug is required');
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(props.slug)) {
      return Result.fail<Product>('Invalid slug format (use lowercase letters, numbers, and hyphens)');
    }

    // Validate description
    if (!props.description || props.description.trim().length < 10) {
      return Result.fail<Product>('Product description must be at least 10 characters');
    }

    // Validate images
    if (!props.images || props.images.length === 0) {
      return Result.fail<Product>('At least one product image is required');
    }

    if (props.images.length > 5) {
      return Result.fail<Product>('Maximum 5 product images allowed');
    }

    // Validate price
    if (props.price.amount <= 0) {
      return Result.fail<Product>('Product price must be positive');
    }

    // Validate stock quantity
    if (props.stockQuantity < 0) {
      return Result.fail<Product>('Stock quantity cannot be negative');
    }

    // Validate weight if provided
    if (props.weight !== undefined && props.weight <= 0) {
      return Result.fail<Product>('Product weight must be positive');
    }

    // Validate dimensions if provided
    if (props.dimensions) {
      if (props.dimensions.length <= 0 || props.dimensions.width <= 0 || props.dimensions.height <= 0) {
        return Result.fail<Product>('Product dimensions must be positive');
      }
    }

    // Validate compare at price
    if (props.compareAtPrice && props.compareAtPrice.lessThan(props.price)) {
      return Result.fail<Product>('Compare at price must be greater than or equal to price');
    }

    const product = new Product(
      {
        ...props,
        isActive: props.isActive ?? true,
        isFeatured: props.isFeatured ?? false,
        requiresSpecialHandling: props.requiresSpecialHandling ?? false,
        lowStockThreshold: props.lowStockThreshold || 10,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
      },
      id
    );

    return Result.ok<Product>(product);
  }

  // Getters
  public get vendorId(): string {
    return this.props.vendorId;
  }

  public get categoryId(): string {
    return this.props.categoryId;
  }

  public get name(): string {
    return this.props.name;
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get description(): string {
    return this.props.description;
  }

  public get images(): string[] {
    return [...this.props.images];
  }

  public get price(): Money {
    return this.props.price;
  }

  public get compareAtPrice(): Money | undefined {
    return this.props.compareAtPrice;
  }

  public get stockQuantity(): number {
    return this.props.stockQuantity;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  public get sku(): string | undefined {
    return this.props.sku;
  }

  public get weight(): number | undefined {
    return this.props.weight;
  }

  public get requiresSpecialHandling(): boolean {
    return this.props.requiresSpecialHandling;
  }

  // Business Logic Methods

  /**
   * Update product price
   */
  public updatePrice(newPrice: Money, compareAtPrice?: Money): Result<void> {
    if (newPrice.amount <= 0) {
      return Result.fail<void>('Price must be positive');
    }

    if (compareAtPrice && compareAtPrice.lessThan(newPrice)) {
      return Result.fail<void>('Compare at price must be greater than or equal to price');
    }

    this.props.price = newPrice;
    this.props.compareAtPrice = compareAtPrice;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Add stock
   */
  public addStock(quantity: number): Result<void> {
    if (quantity <= 0) {
      return Result.fail<void>('Quantity to add must be positive');
    }

    this.props.stockQuantity += quantity;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Remove stock (for order fulfillment)
   */
  public removeStock(quantity: number): Result<void> {
    if (quantity <= 0) {
      return Result.fail<void>('Quantity to remove must be positive');
    }

    if (quantity > this.props.stockQuantity) {
      return Result.fail<void>('Insufficient stock');
    }

    this.props.stockQuantity -= quantity;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Check if product is in stock
   */
  public isInStock(quantity: number = 1): boolean {
    return this.props.stockQuantity >= quantity;
  }

  /**
   * Check if product is low on stock
   */
  public isLowStock(): boolean {
    return this.props.stockQuantity > 0 && this.props.stockQuantity <= this.props.lowStockThreshold;
  }

  /**
   * Check if product is out of stock
   */
  public isOutOfStock(): boolean {
    return this.props.stockQuantity === 0;
  }

  /**
   * Activate product
   */
  public activate(): Result<void> {
    if (this.props.isActive) {
      return Result.fail<void>('Product is already active');
    }

    this.props.isActive = true;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Deactivate product
   */
  public deactivate(): Result<void> {
    if (!this.props.isActive) {
      return Result.fail<void>('Product is already inactive');
    }

    this.props.isActive = false;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Mark as featured
   */
  public markAsFeatured(): Result<void> {
    if (!this.props.isActive) {
      return Result.fail<void>('Only active products can be featured');
    }

    this.props.isFeatured = true;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Unmark as featured
   */
  public unmarkAsFeatured(): Result<void> {
    this.props.isFeatured = false;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Update product details
   */
  public updateDetails(updates: {
    name?: string;
    description?: string;
    images?: string[];
  }): Result<void> {
    if (updates.name) {
      if (updates.name.trim().length < 2) {
        return Result.fail<void>('Product name must be at least 2 characters');
      }
      this.props.name = updates.name.trim();
    }

    if (updates.description) {
      if (updates.description.trim().length < 10) {
        return Result.fail<void>('Product description must be at least 10 characters');
      }
      this.props.description = updates.description.trim();
    }

    if (updates.images) {
      if (updates.images.length === 0) {
        return Result.fail<void>('At least one product image is required');
      }
      if (updates.images.length > 5) {
        return Result.fail<void>('Maximum 5 product images allowed');
      }
      this.props.images = updates.images;
    }

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Check if product is available in a specific delivery zone
   */
  public isAvailableInZone(zoneId: string): boolean {
    if (!this.props.areaWiseAvailability) {
      return true; // Available everywhere if not configured
    }

    return this.props.areaWiseAvailability.get(zoneId) ?? true;
  }

  /**
   * Update zone availability
   */
  public updateZoneAvailability(zoneId: string, isAvailable: boolean): Result<void> {
    if (!this.props.areaWiseAvailability) {
      this.props.areaWiseAvailability = new Map();
    }

    this.props.areaWiseAvailability.set(zoneId, isAvailable);
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Calculate discount percentage
   */
  public getDiscountPercentage(): number {
    if (!this.props.compareAtPrice) {
      return 0;
    }

    const discount =
      ((this.props.compareAtPrice.amount - this.props.price.amount) / this.props.compareAtPrice.amount) *
      100;

    return Math.round(discount);
  }

  /**
   * Check if product is on sale
   */
  public isOnSale(): boolean {
    return this.props.compareAtPrice !== undefined && this.getDiscountPercentage() > 0;
  }

  /**
   * Check if product can be ordered
   */
  public canBeOrdered(quantity: number = 1): boolean {
    return this.props.isActive && this.isInStock(quantity);
  }

  /**
   * Get product status for display
   */
  public getStatus(): 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'LOW_STOCK' {
    if (!this.props.isActive) {
      return 'INACTIVE';
    }

    if (this.isOutOfStock()) {
      return 'OUT_OF_STOCK';
    }

    if (this.isLowStock()) {
      return 'LOW_STOCK';
    }

    return 'ACTIVE';
  }
}
