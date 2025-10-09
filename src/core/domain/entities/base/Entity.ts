/**
 * Base Entity class
 * All domain entities inherit from this class
 *
 * Entities are defined by their identity, not their attributes
 * Two entities with the same ID are considered the same entity
 */

export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;

  constructor(props: T, id?: string) {
    this._id = id || crypto.randomUUID();
    this.props = props;
  }

  /**
   * Get the entity ID
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Compare entities by ID
   */
  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    return this._id === entity._id;
  }

  /**
   * Get a copy of the props
   */
  protected get propsValue(): T {
    return { ...this.props };
  }
}
