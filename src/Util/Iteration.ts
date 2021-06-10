/**
 * Get the list of all combinations of n elements among array, sorted by index.
 * @param array An array with no duplicates (assumed)
 * @param n The size of each combination
 * @returns The list of combinations
 */
export function combinations<T extends number | string>(
  array: T[],
  n: number
): T[][] {
  if (n === 0) {
    return [[]];
  }

  if (array.length < n) {
    return [];
  }

  const result: T[][] = [];

  for (let i = 0; i <= array.length - n; i++) {
    for (const combination of combinations(array.slice(i + 1), n - 1)) {
      result.push([array[i], ...combination]);
    }
  }

  return result;
}
