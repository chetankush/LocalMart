/**
 * Order Entity
 * Represents a customer order with vendor-managed delivery
 */

import { Entity } from './base/Entity';
import { Result } from '@/shared/types/result';
import { Money } from '../value-objects/Money';
import { Address } from '../value-objects/Address';
import { BusinessRuleViolationError } from '../errors/DomainError';

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  productSnapshot: any; // Full product details at order time
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

interface OrderProps {
  orderNumber: string;
  customerId: string;
  vendorId: string;

  // Order Status
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];

  // Order Items
  items: OrderItem[];

  // Amounts
  subtotal: Money;
  deliveryFee: Money;
  taxAmount: Money;
  discount: Money;
  totalAmount: Money;

  // Commission & Payouts
  platformCommission: Money;
  vendorPayout: Money;

  // Delivery
  deliveryAddress: Address;
  deliveryInstructions?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;

  // Payment
  paymentStatus: PaymentStatus;
  paymentId?: string;
  paymentMethod?: string;

  // Payout
  payoutStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  payoutId?: string;
  payoutDate?: Date;

  // Communication
  customerNotes?: string;
  vendorNotes?: string;

  // Timestamps
  placedAt: Date;
  acceptedAt?: Date;
  cancelledAt?: Date;
  deliveredAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export class Order extends Entity<OrderProps> {
  private constructor(props: OrderProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method to create an Order entity
   */
  public static create(props: OrderProps, id?: string): Result<Order> {
    // Validate order number
    if (!props.orderNumber || props.orderNumber.trim().length === 0) {
      return Result.fail<Order>('Order number is required');
    }

    // Validate items
    if (!props.items || props.items.length === 0) {
      return Result.fail<Order>('Order must have at least one item');
    }

    // Validate amounts are positive
    if (props.subtotal.amount < 0) {
      return Result.fail<Order>('Subtotal cannot be negative');
    }

    if (props.totalAmount.amount <= 0) {
      return Result.fail<Order>('Total amount must be positive');
    }

    // Validate delivery fee
    if (props.deliveryFee.amount < 0) {
      return Result.fail<Order>('Delivery fee cannot be negative');
    }

    const order = new Order(
      {
        ...props,
        status: props.status || OrderStatus.PENDING,
        statusHistory: props.statusHistory || [
          {
            status: OrderStatus.PENDING,
            timestamp: new Date(),
            note: 'Order placed',
          },
        ],
        paymentStatus: props.paymentStatus || PaymentStatus.PENDING,
        payoutStatus: props.payoutStatus || 'PENDING',
        taxAmount: props.taxAmount || Money.create(0, props.totalAmount.currency).getValue(),
        discount: props.discount || Money.create(0, props.totalAmount.currency).getValue(),
        placedAt: props.placedAt || new Date(),
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
      },
      id
    );

    return Result.ok<Order>(order);
  }

  // Getters
  public get orderNumber(): string {
    return this.props.orderNumber;
  }

  public get customerId(): string {
    return this.props.customerId;
  }

  public get vendorId(): string {
    return this.props.vendorId;
  }

  public get status(): OrderStatus {
    return this.props.status;
  }

  public get paymentStatus(): PaymentStatus {
    return this.props.paymentStatus;
  }

  public get items(): OrderItem[] {
    return [...this.props.items];
  }

  public get totalAmount(): Money {
    return this.props.totalAmount;
  }

  public get deliveryAddress(): Address {
    return this.props.deliveryAddress;
  }

  public get statusHistory(): OrderStatusHistoryEntry[] {
    return [...this.props.statusHistory];
  }

  public get vendorPayout(): Money {
    return this.props.vendorPayout;
  }

  public get platformCommission(): Money {
    return this.props.platformCommission;
  }

  // Business Logic Methods

  /**
   * Accept order (vendor action)
   */
  public accept(vendorId: string): Result<void> {
    // Verify vendor authorization
    if (this.props.vendorId !== vendorId) {
      return Result.fail<void>('Unauthorized: Only the assigned vendor can accept this order');
    }

    // Check current status
    if (this.props.status !== OrderStatus.PENDING) {
      return Result.fail<void>('Only pending orders can be accepted');
    }

    // Check payment status
    if (this.props.paymentStatus !== PaymentStatus.COMPLETED) {
      return Result.fail<void>('Order cannot be accepted until payment is completed');
    }

    // Update status
    this.props.status = OrderStatus.ACCEPTED;
    this.props.acceptedAt = new Date();
    this.addStatusHistory(OrderStatus.ACCEPTED, 'Order accepted by vendor');

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Mark order as preparing
   */
  public markAsPreparing(vendorId: string): Result<void> {
    if (this.props.vendorId !== vendorId) {
      return Result.fail<void>('Unauthorized: Only the assigned vendor can update this order');
    }

    if (this.props.status !== OrderStatus.ACCEPTED) {
      return Result.fail<void>('Order must be accepted before preparing');
    }

    this.props.status = OrderStatus.PREPARING;
    this.addStatusHistory(OrderStatus.PREPARING, 'Order is being prepared');

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Mark order as ready for delivery
   */
  public markAsReady(vendorId: string): Result<void> {
    if (this.props.vendorId !== vendorId) {
      return Result.fail<void>('Unauthorized');
    }

    if (this.props.status !== OrderStatus.PREPARING) {
      return Result.fail<void>('Order must be in preparing status');
    }

    this.props.status = OrderStatus.READY;
    this.addStatusHistory(OrderStatus.READY, 'Order is ready for delivery');

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Mark order as out for delivery
   */
  public markAsOutForDelivery(vendorId: string): Result<void> {
    if (this.props.vendorId !== vendorId) {
      return Result.fail<void>('Unauthorized');
    }

    if (this.props.status !== OrderStatus.READY) {
      return Result.fail<void>('Order must be ready before dispatch');
    }

    this.props.status = OrderStatus.OUT_FOR_DELIVERY;
    this.addStatusHistory(OrderStatus.OUT_FOR_DELIVERY, 'Order is out for delivery');

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Mark order as delivered
   */
  public markAsDelivered(vendorId: string): Result<void> {
    if (this.props.vendorId !== vendorId) {
      return Result.fail<void>('Unauthorized');
    }

    if (this.props.status !== OrderStatus.OUT_FOR_DELIVERY) {
      return Result.fail<void>('Order must be out for delivery');
    }

    this.props.status = OrderStatus.DELIVERED;
    this.props.deliveredAt = new Date();
    this.props.actualDeliveryTime = new Date();
    this.addStatusHistory(OrderStatus.DELIVERED, 'Order delivered successfully');

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Cancel order
   */
  public cancel(reason: string, actorId: string): Result<void> {
    // Only pending or accepted orders can be cancelled
    if (![OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(this.props.status)) {
      return Result.fail<void>('Order cannot be cancelled at this stage');
    }

    // Verify authorization (customer or vendor can cancel)
    if (actorId !== this.props.customerId && actorId !== this.props.vendorId) {
      return Result.fail<void>('Unauthorized to cancel this order');
    }

    this.props.status = OrderStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.addStatusHistory(OrderStatus.CANCELLED, reason);

    // Update payment status to refunded if payment was completed
    if (this.props.paymentStatus === PaymentStatus.COMPLETED) {
      this.props.paymentStatus = PaymentStatus.REFUNDED;
    }

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Process refund
   */
  public refund(reason: string): Result<void> {
    if (this.props.status === OrderStatus.CANCELLED || this.props.status === OrderStatus.REFUNDED) {
      // Already cancelled or refunded
      this.props.status = OrderStatus.REFUNDED;
      this.props.paymentStatus = PaymentStatus.REFUNDED;
      this.addStatusHistory(OrderStatus.REFUNDED, reason);

      this.props.updatedAt = new Date();

      return Result.ok<void>();
    }

    return Result.fail<void>('Only cancelled orders can be refunded');
  }

  /**
   * Update estimated delivery time
   */
  public updateEstimatedDeliveryTime(time: Date, vendorId: string): Result<void> {
    if (this.props.vendorId !== vendorId) {
      return Result.fail<void>('Unauthorized');
    }

    if (time < new Date()) {
      return Result.fail<void>('Estimated delivery time cannot be in the past');
    }

    this.props.estimatedDeliveryTime = time;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Add vendor notes
   */
  public addVendorNotes(notes: string, vendorId: string): Result<void> {
    if (this.props.vendorId !== vendorId) {
      return Result.fail<void>('Unauthorized');
    }

    this.props.vendorNotes = notes;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Update payment status
   */
  public updatePaymentStatus(status: PaymentStatus, paymentId?: string): Result<void> {
    this.props.paymentStatus = status;

    if (paymentId) {
      this.props.paymentId = paymentId;
    }

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Process vendor payout
   */
  public processPayout(payoutId: string): Result<void> {
    if (this.props.status !== OrderStatus.DELIVERED) {
      return Result.fail<void>('Payout can only be processed for delivered orders');
    }

    if (this.props.paymentStatus !== PaymentStatus.COMPLETED) {
      return Result.fail<void>('Payment must be completed before payout');
    }

    this.props.payoutStatus = 'COMPLETED';
    this.props.payoutId = payoutId;
    this.props.payoutDate = new Date();

    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  /**
   * Check if order can be reviewed
   */
  public canBeReviewed(): boolean {
    return this.props.status === OrderStatus.DELIVERED;
  }

  /**
   * Check if order is active
   */
  public isActive(): boolean {
    return ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(this.props.status);
  }

  /**
   * Check if order can be cancelled
   */
  public canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(this.props.status);
  }

  /**
   * Get order age in hours
   */
  public getAgeInHours(): number {
    const now = new Date();
    const diff = now.getTime() - this.props.placedAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }

  /**
   * Check if order is delayed
   */
  public isDelayed(): boolean {
    if (!this.props.estimatedDeliveryTime) {
      return false;
    }

    return new Date() > this.props.estimatedDeliveryTime && !this.props.deliveredAt;
  }

  /**
   * Calculate delivery time (in minutes)
   */
  public getDeliveryTime(): number | null {
    if (!this.props.deliveredAt || !this.props.placedAt) {
      return null;
    }

    const diff = this.props.deliveredAt.getTime() - this.props.placedAt.getTime();
    return Math.floor(diff / (1000 * 60));
  }

  /**
   * Get total items count
   */
  public getTotalItemsCount(): number {
    return this.props.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Private helper methods

  private addStatusHistory(status: OrderStatus, note?: string): void {
    this.props.statusHistory.push({
      status,
      timestamp: new Date(),
      note,
    });
  }
}
