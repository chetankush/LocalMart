/**
 * Base Domain Error
 * All domain-specific errors extend from this class
 */

export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 * Thrown when validation fails in domain logic
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Not Found Error
 * Thrown when an entity is not found
 */
export class NotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`);
  }
}

/**
 * Authorization Error
 * Thrown when user is not authorized to perform an action
 */
export class AuthorizationError extends DomainError {
  constructor(message: string = 'Not authorized to perform this action') {
    super(message);
  }
}

/**
 * Business Rule Violation Error
 * Thrown when a business rule is violated
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Conflict Error
 * Thrown when there's a conflict with existing data
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
