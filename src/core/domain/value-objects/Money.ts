/**
 * Money Value Object
 * Represents monetary values with currency
 * Immutable and handles decimal precision correctly
 */

import { Result } from '@/shared/types/result';
import { ValueObject } from './base/ValueObject';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  /**
   * Factory method to create Money value object
   */
  public static create(amount: number, currency: string = 'INR'): Result<Money> {
    // Validate amount
    if (amount < 0) {
      return Result.fail<Money>('Amount cannot be negative');
    }

    if (!Number.isFinite(amount)) {
      return Result.fail<Money>('Amount must be a finite number');
    }

    // Validate currency
    if (!currency || currency.length !== 3) {
      return Result.fail<Money>('Currency must be a valid 3-letter code');
    }

    // Round to 2 decimal places to avoid floating point precision issues
    const roundedAmount = Math.round(amount * 100) / 100;

    return Result.ok<Money>(new Money({ amount: roundedAmount, currency: currency.toUpperCase() }));
  }

  /**
   * Get the numeric amount
   */
  public get amount(): number {
    return this.props.amount;
  }

  /**
   * Get the currency code
   */
  public get currency(): string {
    return this.props.currency;
  }

  /**
   * Add two money values
   * Returns error if currencies don't match
   */
  public add(money: Money): Result<Money> {
    if (this.props.currency !== money.props.currency) {
      return Result.fail<Money>('Cannot add money with different currencies');
    }

    return Money.create(this.props.amount + money.props.amount, this.props.currency);
  }

  /**
   * Subtract two money values
   */
  public subtract(money: Money): Result<Money> {
    if (this.props.currency !== money.props.currency) {
      return Result.fail<Money>('Cannot subtract money with different currencies');
    }

    return Money.create(this.props.amount - money.props.amount, this.props.currency);
  }

  /**
   * Multiply money by a number
   */
  public multiply(multiplier: number): Result<Money> {
    if (!Number.isFinite(multiplier)) {
      return Result.fail<Money>('Multiplier must be a finite number');
    }

    return Money.create(this.props.amount * multiplier, this.props.currency);
  }

  /**
   * Calculate percentage of money
   */
  public percentage(percent: number): Result<Money> {
    if (percent < 0 || percent > 100) {
      return Result.fail<Money>('Percentage must be between 0 and 100');
    }

    return Money.create((this.props.amount * percent) / 100, this.props.currency);
  }

  /**
   * Check if this money is greater than another
   */
  public greaterThan(money: Money): boolean {
    if (this.props.currency !== money.props.currency) {
      throw new Error('Cannot compare money with different currencies');
    }

    return this.props.amount > money.props.amount;
  }

  /**
   * Check if this money is less than another
   */
  public lessThan(money: Money): boolean {
    if (this.props.currency !== money.props.currency) {
      throw new Error('Cannot compare money with different currencies');
    }

    return this.props.amount < money.props.amount;
  }

  /**
   * Format money for display
   */
  public format(locale: string = 'en-IN'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.props.currency,
    }).format(this.props.amount);
  }

  /**
   * Get formatted amount without currency symbol
   */
  public toString(): string {
    return this.props.amount.toFixed(2);
  }
}
