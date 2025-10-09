/**
 * Result Pattern for functional error handling
 * Inspired by Railway Oriented Programming
 *
 * This pattern allows us to handle errors explicitly without throwing exceptions
 * making the code more predictable and easier to test.
 */

export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: string;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: string, value?: T) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  /**
   * Create a successful result
   */
  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  /**
   * Create a failed result
   */
  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  /**
   * Combine multiple results
   * Returns success only if all results are successful
   */
  public static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) {
        return result;
      }
    }
    return Result.ok();
  }

  /**
   * Get the value of a successful result
   * Throws if the result is a failure
   */
  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Can't get the value of an error result. Use 'errorValue' instead.`);
    }

    return this._value as T;
  }

  /**
   * Get the error message
   */
  public getError(): string {
    if (this.isSuccess) {
      throw new Error(`Can't get the error of a successful result.`);
    }

    return this.error as string;
  }
}
