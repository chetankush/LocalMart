/**
 * DeliveryCharge Value Object
 * Represents delivery charges with pricing logic
 */

import { Result } from '@/shared/types/result';
import { ValueObject } from './base/ValueObject';
import { Money } from './Money';

interface DeliveryChargeProps {
  baseCharge: Money;
  distanceCharge?: Money; // Per kilometer charge
  distance?: number; // in kilometers
  minimumOrderAmount: Money;
}

export class DeliveryCharge extends ValueObject<DeliveryChargeProps> {
  private constructor(props: DeliveryChargeProps) {
    super(props);
  }

  /**
   * Factory method to create DeliveryCharge
   */
  public static create(props: DeliveryChargeProps): Result<DeliveryCharge> {
    // Validate base charge
    if (props.baseCharge.amount < 0) {
      return Result.fail<DeliveryCharge>('Base charge cannot be negative');
    }

    // Validate distance if provided
    if (props.distance !== undefined && props.distance < 0) {
      return Result.fail<DeliveryCharge>('Distance cannot be negative');
    }

    // Validate minimum order amount
    if (props.minimumOrderAmount.amount < 0) {
      return Result.fail<DeliveryCharge>('Minimum order amount cannot be negative');
    }

    return Result.ok<DeliveryCharge>(new DeliveryCharge(props));
  }

  /**
   * Calculate flat delivery charge (no distance based pricing)
   */
  public static createFlat(charge: Money, minimumOrder: Money): Result<DeliveryCharge> {
    return DeliveryCharge.create({
      baseCharge: charge,
      minimumOrderAmount: minimumOrder,
    });
  }

  /**
   * Calculate distance-based delivery charge
   */
  public static createDistanceBased(
    baseCharge: Money,
    perKmCharge: Money,
    distance: number,
    minimumOrder: Money
  ): Result<DeliveryCharge> {
    return DeliveryCharge.create({
      baseCharge,
      distanceCharge: perKmCharge,
      distance,
      minimumOrderAmount: minimumOrder,
    });
  }

  /**
   * Calculate total delivery charge
   */
  public calculateTotal(): Result<Money> {
    let total = this.props.baseCharge;

    // Add distance-based charge if applicable
    if (this.props.distanceCharge && this.props.distance !== undefined) {
      const distanceChargeResult = this.props.distanceCharge.multiply(this.props.distance);

      if (distanceChargeResult.isFailure) {
        return Result.fail<Money>(distanceChargeResult.getError());
      }

      const addResult = total.add(distanceChargeResult.getValue());

      if (addResult.isFailure) {
        return Result.fail<Money>(addResult.getError());
      }

      total = addResult.getValue();
    }

    return Result.ok<Money>(total);
  }

  /**
   * Check if order meets minimum amount requirement
   */
  public meetsMinimumOrder(orderAmount: Money): boolean {
    return (
      orderAmount.currency === this.props.minimumOrderAmount.currency &&
      orderAmount.amount >= this.props.minimumOrderAmount.amount
    );
  }

  /**
   * Get minimum order amount required
   */
  public get minimumOrderAmount(): Money {
    return this.props.minimumOrderAmount;
  }

  /**
   * Get base charge
   */
  public get baseCharge(): Money {
    return this.props.baseCharge;
  }

  /**
   * Get distance charge per km
   */
  public get perKmCharge(): Money | undefined {
    return this.props.distanceCharge;
  }

  /**
   * Get delivery distance
   */
  public get distance(): number | undefined {
    return this.props.distance;
  }

  /**
   * Check if delivery charge is free
   */
  public isFree(): boolean {
    const totalResult = this.calculateTotal();
    if (totalResult.isFailure) {
      return false;
    }

    return totalResult.getValue().amount === 0;
  }
}
