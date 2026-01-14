import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>,
  );
}

export function assertExists<T>(value: T | null | undefined, msg?: string): T {
  if (value === null || value === undefined) {
    throw new Error(msg || "Value is null or undefined");
  }

  return value;
}

export function truthyMap<T, O extends NonNullable<any>>(arr: T[], fn: (item: T) => O | null | undefined): O[] {
  let result: O[] = [];
  for (const item of arr) {
    const transformed = fn(item);
    if (!transformed) continue;
    result.push(transformed);
  }
  return result;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to transform one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a matrix to store distances
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings using Levenshtein distance
 * Returns a percentage from 0-100, where 100 means identical strings
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 100;
  if (!str1 || !str2) return 0;

  // Normalize strings for comparison (lowercase, trim whitespace)
  const normalized1 = str1.toLowerCase().trim();
  const normalized2 = str2.toLowerCase().trim();

  if (normalized1 === normalized2) return 100;

  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 100;

  const distance = levenshteinDistance(normalized1, normalized2);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity * 100) / 100; // Round to 2 decimal places
}
