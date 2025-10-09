/**
 * User Repository Interface
 * Defines contract for user data access
 * Implementation will be in infrastructure layer
 */

import { User } from '../entities/User';
import { Result } from '@/shared/types/result';

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string; // Search by name or email
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<Result<User | null>>;

  /**
   * Find user by Clerk ID
   */
  findByClerkId(clerkId: string): Promise<Result<User | null>>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<Result<User | null>>;

  /**
   * Find user by phone
   */
  findByPhone(phone: string): Promise<Result<User | null>>;

  /**
   * Find all users with filters and pagination
   */
  findAll(filters: UserFilters, pagination: PaginationOptions): Promise<Result<PaginatedResult<User>>>;

  /**
   * Create a new user
   */
  create(user: User): Promise<Result<User>>;

  /**
   * Update existing user
   */
  update(user: User): Promise<Result<User>>;

  /**
   * Delete user (soft delete - marks as inactive)
   */
  delete(id: string): Promise<Result<void>>;

  /**
   * Check if user exists by email
   */
  existsByEmail(email: string): Promise<Result<boolean>>;

  /**
   * Check if user exists by phone
   */
  existsByPhone(phone: string): Promise<Result<boolean>>;

  /**
   * Get user count by role
   */
  countByRole(role: string): Promise<Result<number>>;
}
