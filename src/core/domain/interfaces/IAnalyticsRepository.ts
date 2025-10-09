/**
 * Analytics Repository Interface
 * Defines contract for analytics data access
 */

import { Result } from '@/shared/types/result';

export interface VendorAnalytics {
  vendorId: string;
  date: Date;

  // Sales Metrics
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  platformCommission: number;
  netRevenue: number;

  // Delivery Performance
  averageDeliveryTime?: number; // in minutes
  deliverySuccessRate?: number;
  onTimeDeliveryRate?: number;

  // Customer Metrics
  uniqueCustomers: number;
  repeatCustomers: number;
  avgOrderValue: number;

  // Product Metrics
  totalItemsSold: number;

  // Ratings
  avgProductRating?: number;
  avgDeliveryRating?: number;
  avgOverallRating?: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
}

export interface RevenueByDay {
  date: Date;
  revenue: number;
  orders: number;
}

export interface IAnalyticsRepository {
  /**
   * Get vendor analytics for a specific date
   */
  getVendorAnalytics(vendorId: string, date: Date): Promise<Result<VendorAnalytics | null>>;

  /**
   * Get vendor analytics for date range
   */
  getVendorAnalyticsRange(vendorId: string, dateRange: DateRange): Promise<Result<VendorAnalytics[]>>;

  /**
   * Create or update daily analytics for vendor
   */
  upsertVendorAnalytics(analytics: VendorAnalytics): Promise<Result<void>>;

  /**
   * Get aggregated vendor analytics for period
   */
  getAggregatedVendorAnalytics(vendorId: string, dateRange: DateRange): Promise<Result<VendorAnalytics>>;

  /**
   * Get top selling products for vendor
   */
  getTopProducts(vendorId: string, dateRange: DateRange, limit: number): Promise<Result<TopProduct[]>>;

  /**
   * Get top customers for vendor
   */
  getTopCustomers(vendorId: string, dateRange: DateRange, limit: number): Promise<Result<TopCustomer[]>>;

  /**
   * Get revenue by day for vendor
   */
  getRevenueByDay(vendorId: string, dateRange: DateRange): Promise<Result<RevenueByDay[]>>;

  /**
   * Get customer retention rate
   */
  getCustomerRetentionRate(vendorId: string, dateRange: DateRange): Promise<Result<number>>;

  /**
   * Get platform-wide analytics
   */
  getPlatformAnalytics(dateRange: DateRange): Promise<Result<{
    totalVendors: number;
    activeVendors: number;
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    avgOrderValue: number;
  }>>;

  /**
   * Calculate and store daily analytics for all vendors
   * (Background job)
   */
  calculateDailyAnalytics(date: Date): Promise<Result<void>>;

  /**
   * Get vendor performance comparison
   */
  getVendorPerformanceComparison(
    vendorId: string,
    dateRange: DateRange
  ): Promise<Result<{
    vendorRank: number;
    totalVendors: number;
    percentile: number;
    avgRevenueAllVendors: number;
    vendorRevenue: number;
  }>>;
}
