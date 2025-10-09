/**
 * Address Value Object
 * Represents a physical address with geolocation
 */

import { Result } from '@/shared/types/result';
import { ValueObject } from './base/ValueObject';

interface AddressProps {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props);
  }

  /**
   * Factory method to create Address value object
   */
  public static create(props: AddressProps): Result<Address> {
    // Validate required fields
    if (!props.street || props.street.trim().length === 0) {
      return Result.fail<Address>('Street is required');
    }

    if (!props.city || props.city.trim().length === 0) {
      return Result.fail<Address>('City is required');
    }

    if (!props.state || props.state.trim().length === 0) {
      return Result.fail<Address>('State is required');
    }

    if (!props.zipCode || props.zipCode.trim().length === 0) {
      return Result.fail<Address>('Zip code is required');
    }

    // Validate zip code format (basic validation)
    const zipCodeRegex = /^[0-9]{6}$/; // Indian PIN code format
    if (!zipCodeRegex.test(props.zipCode.trim())) {
      return Result.fail<Address>('Invalid zip code format');
    }

    // Validate coordinates if provided
    if (props.latitude !== undefined) {
      if (props.latitude < -90 || props.latitude > 90) {
        return Result.fail<Address>('Latitude must be between -90 and 90');
      }
    }

    if (props.longitude !== undefined) {
      if (props.longitude < -180 || props.longitude > 180) {
        return Result.fail<Address>('Longitude must be between -180 and 180');
      }
    }

    return Result.ok<Address>(
      new Address({
        ...props,
        country: props.country || 'India',
      })
    );
  }

  public get street(): string {
    return this.props.street;
  }

  public get city(): string {
    return this.props.city;
  }

  public get state(): string {
    return this.props.state;
  }

  public get zipCode(): string {
    return this.props.zipCode;
  }

  public get country(): string {
    return this.props.country;
  }

  public get latitude(): number | undefined {
    return this.props.latitude;
  }

  public get longitude(): number | undefined {
    return this.props.longitude;
  }

  /**
   * Check if address has geolocation
   */
  public hasGeolocation(): boolean {
    return this.props.latitude !== undefined && this.props.longitude !== undefined;
  }

  /**
   * Format address as single line
   */
  public formatSingleLine(): string {
    return `${this.props.street}, ${this.props.city}, ${this.props.state} ${this.props.zipCode}, ${this.props.country}`;
  }

  /**
   * Format address as multi-line
   */
  public formatMultiLine(): string {
    return `${this.props.street}\n${this.props.city}, ${this.props.state} ${this.props.zipCode}\n${this.props.country}`;
  }

  /**
   * Calculate distance to another address (if both have coordinates)
   * Uses Haversine formula
   * Returns distance in kilometers
   */
  public distanceTo(address: Address): number | null {
    if (!this.hasGeolocation() || !address.hasGeolocation()) {
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    const lat1 = this.toRadians(this.props.latitude!);
    const lat2 = this.toRadians(address.props.latitude!);
    const deltaLat = this.toRadians(address.props.latitude! - this.props.latitude!);
    const deltaLon = this.toRadians(address.props.longitude! - this.props.longitude!);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
