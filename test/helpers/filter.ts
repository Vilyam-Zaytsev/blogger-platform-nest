import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';
import { TestSearchFilter } from '../types';

/**
 * A generic utility class for filtering, sorting, and paginating an array of objects.
 *
 * Designed for working with plain JavaScript objects, including support for nested fields.
 * Common use case — filtering and sorting in-memory collections, such as mock data in tests or simple queries.
 *
 * @template T The object type of the elements in the array.
 */
export class Filter<T extends object> {
  private items: T[];
  private propertyMap: Partial<Record<keyof T, string>> = {};
  private skipCount: number = 0;
  private limitCount?: number;
  private sortBy?: keyof T;
  private sortDirection?: SortDirection;

  /**
   * Initializes a new instance of the Filter class.
   *
   * @param {T[]} items - The list of items to apply filtering, sorting, and pagination on.
   */
  constructor(items: T[]) {
    this.items = items;
  }

  /**
   * Recursively creates a map of field names to their full dot-separated paths.
   *
   * Useful for accessing nested fields during sorting.
   *
   * @param {T} obj - The object from which to extract property paths.
   * @param {string} [prefix] - The path prefix for nested properties.
   */
  private createPropertyMap(obj: T, prefix?: string): void {
    const recordObj = obj as unknown as Record<string, unknown>;
    for (const key in recordObj) {
      const value = recordObj[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        this.createPropertyMap(value as unknown as T, path);
      } else {
        this.propertyMap[key as keyof T] = path;
      }
    }
  }

  /**
   * Retrieves a value from an object using a dot-separated property path.
   *
   * @param {T} obj - The object to access.
   * @param {string} path - The dot-separated property path (e.g., "profile.name").
   * @returns {unknown} The value at the specified path or undefined if not found.
   */
  private getValueByPath(obj: T, path: string): unknown {
    return path.split('.').reduce((acc: unknown, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Compares two values based on the provided sort direction.
   *
   * @param {unknown} a - First value to compare.
   * @param {unknown} b - Second value to compare.
   * @param {SortDirection} direction - Sorting direction (ascending or descending).
   * @returns {number} The comparison result: -1, 0, or 1.
   */
  private compareValues(
    a: unknown,
    b: unknown,
    direction: SortDirection,
  ): number {
    if (typeof a === 'string' && typeof b === 'string') {
      const comparison: number = a.localeCompare(b);
      return direction === SortDirection.Ascending ? comparison : -comparison;
    }
    if (typeof a === 'number' && typeof b === 'number') {
      if (a < b) return direction === SortDirection.Ascending ? -1 : 1;
      if (a > b) return direction === SortDirection.Ascending ? 1 : -1;
      return 0;
    }
    return 0;
  }

  /**
   * Sets sorting configuration based on a property and direction.
   * Supports sorting by nested properties.
   *
   * @param {Partial<Record<keyof T, SortDirection>>} sortObj - Sorting configuration object.
   * @returns {this} The current Filter instance for chaining.
   */
  sort(sortObj: Partial<Record<keyof T, SortDirection>>): this {
    const keys = Object.keys(sortObj) as (keyof T)[];
    if (keys.length === 0) return this;

    this.sortBy = keys[0];
    this.sortDirection = sortObj[this.sortBy];

    if (this.items.length > 0) {
      this.createPropertyMap(this.items[0]);
    }

    return this;
  }

  /**
   * Skips the first N items in the result set.
   *
   * @param {number} count - The number of items to skip.
   * @returns {this} The current Filter instance for chaining.
   */
  skip(count: number): this {
    this.skipCount = count;
    return this;
  }

  /**
   * Limits the number of items in the result set.
   *
   * @param {number} count - The maximum number of items to return.
   * @returns {this} The current Filter instance for chaining.
   */
  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  /**
   * Filters items based on a search filter.
   * Currently only supports partial, case-insensitive string matches on top-level string fields.
   *
   * @param {Partial<TestSearchFilter>} searchFilter - Key-value pairs for filtering.
   * @returns {this} The current Filter instance for chaining.
   */
  filter(searchFilter: Partial<TestSearchFilter>): this {
    this.items = this.items.filter((item) => {
      let hasAtLeastOneMatch = false;

      for (const key in searchFilter) {
        const searchTerm: string | undefined =
          searchFilter[key as keyof TestSearchFilter];
        if (searchTerm == null || searchTerm === '') continue;

        const fieldName: string = key;

        if (!(fieldName in item)) {
          continue;
        }

        const itemValue = item[fieldName as keyof T];

        if (typeof itemValue !== 'string') continue;

        if (itemValue.toLowerCase().includes(searchTerm.toLowerCase()))
          hasAtLeastOneMatch = true;
      }
      return hasAtLeastOneMatch;
    });

    return this;
  }

  /**
   * Executes the sorting, skipping, limiting, and returns the final array.
   *
   * @returns {T[]} The processed and filtered array of items.
   *
   * @throws {Error} If the specified sortBy field is invalid.
   */
  getResult(): T[] {
    let result: T[] = [...this.items];

    if (this.sortBy && this.sortDirection) {
      const path = this.propertyMap[this.sortBy];
      if (!path) {
        throw new Error(`Invalid sortBy property: ${String(this.sortBy)}`);
      }

      result = result.sort((a, b) => {
        const aValue = this.getValueByPath(a, path);
        const bValue = this.getValueByPath(b, path);
        return this.compareValues(aValue, bValue, this.sortDirection!);
      });
    }

    if (this.skipCount) {
      result = result.slice(this.skipCount);
    }

    if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }

    return result;
  }
}
