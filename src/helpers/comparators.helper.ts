// comparators.ts

import deepEqual from 'fast-deep-equal';

/**
 * Checks if a number is between two values (inclusive).
 *
 * @param num - The number to check.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns True if the number is between min and max, inclusive.
 */
export function isBetween(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * Checks if a number is greater than another number.
 *
 * @param num - The number to check.
 * @param compareTo - The number to compare to.
 * @returns True if the number is greater than compareTo.
 */
export function isGreaterThan(num: number, compareTo: number): boolean {
  return num > compareTo;
}

/**
 * Checks if a number is less than another number.
 *
 * @param num - The number to check.
 * @param compareTo - The number to compare to.
 * @returns True if the number is less than compareTo.
 */
export function isLessThan(num: number, compareTo: number): boolean {
  return num < compareTo;
}

/**
 * Checks if a value is equal to another value.
 *
 * @param a - The first value.
 * @param b - The second value.
 * @returns True if the values are equal.
 */
export function isEqual<T = unknown, K = unknown>(a: T, b: K): boolean {
  return deepEqual(a, b);
}
