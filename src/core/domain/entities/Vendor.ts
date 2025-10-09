/**
 * Vendor Entity
 * Represents a vendor/store with delivery management capabilities
 */

import { Entity } from './base/Entity';
import { Result } from '@/shared/types/result';
import { Money } from '../value-objects/Money';
import { Address } from '../value-objects/Address';

export enum VendorStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum BusinessType {
  GROCERY = 'GROCERY',
  RESTAURANT = 'RESTAURANT',
  PHARMACY = 'PHARMACY',
  ELECTRONICS = 'ELECTRONICS',
  FASHION = 'FASHION',
  HOME_SERVICES = 'HOME_SERVICES',
  OTHER = 'OTHER',
}

export interface DeliveryZone {
  id: string;
  name: string;
  radius: number; // in kilometers
  coordinates: { lat: number; lng: number };
  deliveryCharge: number;
  minOrderAmount: number;
}

export interface DeliveryTimeWindow {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

interface VendorProps {
  userId: string;
  businessName: string;
  businessType: BusinessType;
  gstNumber?: string;
  businessLicense?: string;
  storeDescription?: string;
  storeLogo?: string;

  // Delivery Configuration
  deliveryZones: DeliveryZone[];
  deliveryTimeWindows: DeliveryTimeWindow[];
  minOrderAmount: Money;
  maxDeliveryDistance?: number;
  deliveryPolicy?: string;

  // Status
  status: VendorStatus;
  isActive: boolean;
  canDeliver: boolean;

  // Commission
  commissionRate: number;
  subscriptionPlan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

  // Contact
  contactEmail: string;
  contactPhone: string;
  businessAddress: Address;
  businessHours?: BusinessHours;

  // Verification
  isVerified: boolean;
  verifiedAt?: Date;
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export class Vendor extends Entity<VendorProps> {
  private constructor(props: VendorProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method to create a Vendor entity
   */
  public static create(props: VendorProps, id?: string): Result<Vendor> {
    // Validate business name
    if (!props.businessName || props.businessName.trim().length < 2) {
      return Result.fail<Vendor>('Business name must be at least 2 characters');
    }

    // Validate contact email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(props.contactEmail)) {
      return Result.fail<Vendor>('Invalid contact email format');
    }

    // Validate contact phone
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(props.contactPhone.replace(/\s/g, ''))) {
      return Result.fail<Vendor>('Invalid contact phone format');
    }

    // Validate commission rate
    if (props.commissionRate < 0 || props.commissionRate > 1) {
      return Result.fail<Vendor>('Commission rate must be between 0 and 1');
    }

    // Validate delivery zones
    if (!props.deliveryZones || props.deliveryZones.length === 0) {
      return Result.fail<Vendor>('At least one delivery zone is required');
    }

    const vendor = new Vendor(
      {
        ...props,
        status: props.status || VendorStatus.PENDING_APPROVAL,
        isActive: props.isActive ?? true,
        canDeliver: props.canDeliver ?? true,
        isVerified: props.isVerified ?? false,
        subscriptionPlan: props.subscriptionPlan || 'BASIC',
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
      },
      id
    );

    return Result.ok<Vendor>(vendor);
  }

  // Getters
  public get userId(): string {
    return this.props.userId;
  }

  public get businessName(): string {
    return this.props.businessName;
  }

  public get businessType(): BusinessType {
    return this.props.businessType;
  }

  public get status(): VendorStatus {
    return this.props.status;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get canDeliver(): boolean {
    return this.props.canDeliver;
  }

  public get deliveryZones(): DeliveryZone[] {
    return [...this.props.deliveryZones];
  }

  public get minOrderAmount(): Money {
    return this.props.minOrderAmount;
  }

  public get commissionRate(): number {
    return this.props.commissionRate;
  }

  public get subscriptionPlan(): string {
    return this.props.subscriptionPlan;
  }

  public get contactEmail(): string {
    return this.props.contactEmail;
  }

  public get contactPhone(): string {
    return this.props.contactPhone;
  }

  public get businessAddress(): Address {
    return this.props.businessAddress;
  }

  public get isVerified(): boolean {
    return this.props.isVerified;
  }

  // Business Logic Methods

  /**
   * Approve vendor after review
   */
  public approve(): Result<void> {
    if (this.props.status !== VendorStatus.PENDING_APPROVAL) {
      return Result.fail<void>('Only pending vendors can be approved');
    }

    this.props.status = VendorStatus.APPROVED;
    this.props.isVerified = true;
    this.props.verifiedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Reject vendor application
   */
  public reject(reason: string): Result<void> {
    if (this.props.status !== VendorStatus.PENDING_APPROVAL) {
      return Result.fail<void>('Only pending vendors can be rejected');
    }

    if (!reason || reason.trim().length === 0) {
      return Result.fail<void>('Rejection reason is required');
    }

    this.props.status = VendorStatus.REJECTED;
    this.props.rejectionReason = reason;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Activate vendor
   */
  public activate(): Result<void> {
    if (!this.props.isVerified) {
      return Result.fail<void>('Vendor must be verified before activation');
    }

    if (this.props.status === VendorStatus.REJECTED) {
      return Result.fail<void>('Rejected vendors cannot be activated');
    }

    this.props.status = VendorStatus.ACTIVE;
    this.props.isActive = true;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Suspend vendor
   */
  public suspend(reason: string): Result<void> {
    if (this.props.status !== VendorStatus.ACTIVE) {
      return Result.fail<void>('Only active vendors can be suspended');
    }

    this.props.status = VendorStatus.SUSPENDED;
    this.props.isActive = false;
    this.props.rejectionReason = reason;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Update delivery zones
   */
  public updateDeliveryZones(zones: DeliveryZone[]): Result<void> {
    if (!zones || zones.length === 0) {
      return Result.fail<void>('At least one delivery zone is required');
    }

    // Validate each zone
    for (const zone of zones) {
      if (!zone.name || zone.name.trim().length === 0) {
        return Result.fail<void>('Zone name is required');
      }
      if (zone.radius <= 0) {
        return Result.fail<void>('Zone radius must be positive');
      }
      if (zone.deliveryCharge < 0) {
        return Result.fail<void>('Delivery charge cannot be negative');
      }
    }

    this.props.deliveryZones = zones;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Check if vendor delivers to a specific location
   */
  public deliversTo(address: Address): boolean {
    if (!this.props.canDeliver || !this.props.isActive) {
      return false;
    }

    if (!address.hasGeolocation() || !this.props.businessAddress.hasGeolocation()) {
      return false;
    }

    const distance = this.props.businessAddress.distanceTo(address);

    if (distance === null) {
      return false;
    }

    // Check if within any delivery zone
    return this.props.deliveryZones.some(zone => distance <= zone.radius);
  }

  /**
   * Get delivery charge for a specific address
   */
  public getDeliveryCharge(address: Address): Money | null {
    if (!this.deliversTo(address)) {
      return null;
    }

    const distance = this.props.businessAddress.distanceTo(address);
    if (distance === null) {
      return null;
    }

    // Find the applicable delivery zone
    const zone = this.props.deliveryZones.find(z => distance <= z.radius);

    if (!zone) {
      return null;
    }

    const moneyResult = Money.create(zone.deliveryCharge, this.props.minOrderAmount.currency);

    return moneyResult.isSuccess ? moneyResult.getValue() : null;
  }

  /**
   * Update subscription plan
   */
  public updateSubscriptionPlan(plan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'): Result<void> {
    const commissionRates = {
      BASIC: 0.04,
      PREMIUM: 0.025,
      ENTERPRISE: 0.02,
    };

    this.props.subscriptionPlan = plan;
    this.props.commissionRate = commissionRates[plan];
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Update business profile
   */
  public updateProfile(updates: {
    businessName?: string;
    storeDescription?: string;
    storeLogo?: string;
    deliveryPolicy?: string;
  }): Result<void> {
    if (updates.businessName && updates.businessName.trim().length >= 2) {
      this.props.businessName = updates.businessName.trim();
    }

    if (updates.storeDescription) {
      this.props.storeDescription = updates.storeDescription;
    }

    if (updates.storeLogo) {
      this.props.storeLogo = updates.storeLogo;
    }

    if (updates.deliveryPolicy) {
      this.props.deliveryPolicy = updates.deliveryPolicy;
    }

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Toggle delivery capability
   */
  public toggleDelivery(canDeliver: boolean): Result<void> {
    if (!this.props.isActive) {
      return Result.fail<void>('Inactive vendors cannot enable delivery');
    }

    this.props.canDeliver = canDeliver;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Check if vendor is accepting orders
   */
  public isAcceptingOrders(): boolean {
    return (
      this.props.isActive &&
      this.props.canDeliver &&
      this.props.status === VendorStatus.ACTIVE &&
      this.props.isVerified
    );
  }
}
