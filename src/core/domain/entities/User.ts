/**
 * User Entity
 * Represents a user in the system (Customer, Vendor, or Admin)
 */

import { Entity } from './base/Entity';
import { Result } from '@/shared/types/result';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
}

interface UserProps {
  clerkId: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method to create a User entity
   */
  public static create(props: UserProps, id?: string): Result<User> {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.email)) {
      return Result.fail<User>('Invalid email format');
    }

    // Validate full name
    if (!props.fullName || props.fullName.trim().length < 2) {
      return Result.fail<User>('Full name must be at least 2 characters');
    }

    // Validate phone if provided
    if (props.phone) {
      const phoneRegex = /^[0-9]{10}$/; // Indian phone number format
      if (!phoneRegex.test(props.phone.replace(/\s/g, ''))) {
        return Result.fail<User>('Invalid phone number format');
      }
    }

    // Validate Clerk ID
    if (!props.clerkId || props.clerkId.trim().length === 0) {
      return Result.fail<User>('Clerk ID is required');
    }

    const user = new User(
      {
        ...props,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
      },
      id
    );

    return Result.ok<User>(user);
  }

  // Getters
  public get clerkId(): string {
    return this.props.clerkId;
  }

  public get email(): string {
    return this.props.email;
  }

  public get phone(): string | undefined {
    return this.props.phone;
  }

  public get fullName(): string {
    return this.props.fullName;
  }

  public get role(): UserRole {
    return this.props.role;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic Methods

  /**
   * Update user profile
   */
  public updateProfile(fullName: string, phone?: string): Result<void> {
    if (fullName && fullName.trim().length >= 2) {
      this.props.fullName = fullName.trim();
    }

    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return Result.fail<void>('Invalid phone number format');
      }
      this.props.phone = phone;
    }

    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  /**
   * Deactivate user
   */
  public deactivate(): Result<void> {
    if (!this.props.isActive) {
      return Result.fail<void>('User is already inactive');
    }

    this.props.isActive = false;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  /**
   * Activate user
   */
  public activate(): Result<void> {
    if (this.props.isActive) {
      return Result.fail<void>('User is already active');
    }

    this.props.isActive = true;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  /**
   * Check if user is a customer
   */
  public isCustomer(): boolean {
    return this.props.role === UserRole.CUSTOMER;
  }

  /**
   * Check if user is a vendor
   */
  public isVendor(): boolean {
    return this.props.role === UserRole.VENDOR;
  }

  /**
   * Check if user is an admin
   */
  public isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }
}
