/**
 * Order Repository Interface
 * Defines contract for order data access
 */

import { Order, OrderStatus, PaymentStatus } from '../entities/Order';
import { Result } from '@/shared/types/result';
import { PaginatedResult, PaginationOptions } from './IUserRepository';

export interface OrderFilters {
  customerId?: string;
  vendorId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Search by order number
}

export interface OrderSortOptions {
  field: 'createdAt' | 'totalAmount' | 'status';
  order: 'asc' | 'desc';
}

export interface OrderStatistics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface IOrderRepository {
  /**
   * Find order by ID
   */
  findById(id: string): Promise<Result<Order | null>>;

  /**
   * Find order by order number
   */
  findByOrderNumber(orderNumber: string): Promise<Result<Order | null>>;

  /**
   * Find all orders with filters, sorting, and pagination
   */
  findAll(
    filters: OrderFilters,
    sort: OrderSortOptions,
    pagination: PaginationOptions
  ): Promise<Result<PaginatedResult<Order>>>;

  /**
   * Find orders by customer
   */
  findByCustomer(customerId: string, pagination: PaginationOptions): Promise<Result<PaginatedResult<Order>>>;

  /**
   * Find orders by vendor
   */
  findByVendor(vendorId: string, filters: OrderFilters, pagination: PaginationOptions): Promise<Result<PaginatedResult<Order>>>;

  /**
   * Find active orders for vendor (not delivered/cancelled)
   */
  findActiveByVendor(vendorId: string): Promise<Result<Order[]>>;

  /**
   * Find pending orders for vendor
   */
  findPendingByVendor(vendorId: string): Promise<Result<Order[]>>;

  /**
   * Find orders needing payout
   */
  findNeedingPayout(vendorId: string): Promise<Result<Order[]>>;

  /**
   * Create a new order
   */
  create(order: Order): Promise<Result<Order>>;

  /**
   * Update existing order
   */
  update(order: Order): Promise<Result<Order>>;

  /**
   * Get order statistics for vendor
   */
  getVendorStatistics(vendorId: string, dateFrom: Date, dateTo: Date): Promise<Result<OrderStatistics>>;

  /**
   * Get order statistics for customer
   */
  getCustomerStatistics(customerId: string): Promise<Result<OrderStatistics>>;

  /**
   * Get platform-wide statistics
   */
  getPlatformStatistics(dateFrom: Date, dateTo: Date): Promise<Result<OrderStatistics>>;

  /**
   * Count orders by status for vendor
   */
  countByStatusForVendor(vendorId: string, status: OrderStatus): Promise<Result<number>>;

  /**
   * Get recent orders for vendor (for dashboard)
   */
  getRecentForVendor(vendorId: string, limit: number): Promise<Result<Order[]>>;

  /**
   * Get recent orders for customer
   */
  getRecentForCustomer(customerId: string, limit: number): Promise<Result<Order[]>>;

  /**
   * Check if customer has ordered from vendor before
   */
  hasCustomerOrderedFromVendor(customerId: string, vendorId: string): Promise<Result<boolean>>;

  /**
   * Get average delivery time for vendor
   */
  getAverageDeliveryTime(vendorId: string): Promise<Result<number | null>>;

  /**
   * Get orders delivered on time rate
   */
  getOnTimeDeliveryRate(vendorId: string): Promise<Result<number>>;
}
