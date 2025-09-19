/**
 * Removes the last character from the provided string.
 *
 * @param {string} str - The string from which the last character will be removed.
 * @return {string} A new string without the last character of the input string.
 */
export function stripEnd(str: string): string {
  return str.substring(0, str.length - 1)
}
