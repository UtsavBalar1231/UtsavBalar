/**
 * Format a date in a readable format.
 *
 * @param date - The date to format
 * @returns A string with the formatted date (e.g., "January 15, 2023")
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
