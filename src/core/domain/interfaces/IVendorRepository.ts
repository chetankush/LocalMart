/**
 * Vendor Repository Interface
 * Defines contract for vendor data access
 */

import { Vendor, VendorStatus, BusinessType } from '../entities/Vendor';
import { Result } from '@/shared/types/result';
import { PaginatedResult, PaginationOptions } from './IUserRepository';
import { Address } from '../value-objects/Address';

export interface VendorFilters {
  status?: VendorStatus;
  businessType?: BusinessType;
  isActive?: boolean;
  canDeliver?: boolean;
  isVerified?: boolean;
  search?: string; // Search by business name
  subscriptionPlan?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
}

export interface VendorWithDistance {
  vendor: Vendor;
  distance: number; // in kilometers
}

export interface IVendorRepository {
  /**
   * Find vendor by ID
   */
  findById(id: string): Promise<Result<Vendor | null>>;

  /**
   * Find vendor by user ID
   */
  findByUserId(userId: string): Promise<Result<Vendor | null>>;

  /**
   * Find all vendors with filters and pagination
   */
  findAll(filters: VendorFilters, pagination: PaginationOptions): Promise<Result<PaginatedResult<Vendor>>>;

  /**
   * Find vendors delivering to a specific address
   */
  findByDeliveryArea(address: Address, pagination: PaginationOptions): Promise<Result<PaginatedResult<VendorWithDistance>>>;

  /**
   * Find vendors by business type in delivery area
   */
  findByBusinessTypeInArea(
    businessType: BusinessType,
    address: Address,
    pagination: PaginationOptions
  ): Promise<Result<PaginatedResult<VendorWithDistance>>>;

  /**
   * Find pending approval vendors
   */
  findPendingApproval(pagination: PaginationOptions): Promise<Result<PaginatedResult<Vendor>>>;

  /**
   * Create a new vendor
   */
  create(vendor: Vendor): Promise<Result<Vendor>>;

  /**
   * Update existing vendor
   */
  update(vendor: Vendor): Promise<Result<Vendor>>;

  /**
   * Delete vendor (soft delete)
   */
  delete(id: string): Promise<Result<void>>;

  /**
   * Check if vendor exists by business name
   */
  existsByBusinessName(businessName: string): Promise<Result<boolean>>;

  /**
   * Get active vendor count
   */
  countActive(): Promise<Result<number>>;

  /**
   * Get vendor count by status
   */
  countByStatus(status: VendorStatus): Promise<Result<number>>;

  /**
   * Get vendors needing approval (admin dashboard)
   */
  getApprovalQueue(): Promise<Result<Vendor[]>>;
}
