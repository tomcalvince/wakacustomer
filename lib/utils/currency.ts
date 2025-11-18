/**
 * Format currency value as UGX
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "UGX 10,000.00")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format currency value with custom currency code
 * @param value - The numeric value to format
 * @param code - Currency code (defaults to "UGX")
 * @returns Formatted currency string
 */
export function formatCurrencyWithCode(value: number, code: string = "UGX"): string {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(value)
}

