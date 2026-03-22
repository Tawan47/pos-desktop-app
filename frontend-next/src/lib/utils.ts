/**
 * Formats a Date object to a local ISO string (YYYY-MM-DD).
 * @param date The date to format.
 * @returns A string in YYYY-MM-DD format, or an empty string if date is null.
 */
export const toLocalISOString = (date: Date | null | undefined): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a currency amount to Thai Baht (฿) with 2 decimal places.
 * @param amount The amount to format.
 * @returns A formatted currency string.
 */
export const formatCurrency = (amount: number): string => {
  return `฿${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Gets the API URL from environment variables or a default value.
 */
export const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};
