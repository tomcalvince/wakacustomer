/**
 * Phone number formatting utilities
 */

/**
 * Format phone number with country code
 * Assumes Kenya/Uganda (+254) if no country code is present
 * @param phone - Phone number string (with or without country code)
 * @param defaultCountryCode - Default country code to use if not present (defaults to +254)
 * @returns Formatted phone number with country code
 */
export function formatPhoneNumber(
  phone: string,
  defaultCountryCode: string = "+254"
): string {
  if (!phone) return ""

  // Remove any whitespace
  const cleaned = phone.trim().replace(/\s+/g, "")

  // If already has country code, return as is
  if (cleaned.startsWith("+")) {
    return cleaned
  }

  // If starts with country code without +, add +
  if (cleaned.startsWith("254") || cleaned.startsWith("256")) {
    return `+${cleaned}`
  }

  // Remove leading 0 if present
  const withoutLeadingZero = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned

  // Add default country code
  return `${defaultCountryCode}${withoutLeadingZero}`
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns true if valid format, false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false

  const formatted = formatPhoneNumber(phone)
  // Basic validation: should start with + and have 9-15 digits after +
  return /^\+[1-9]\d{8,14}$/.test(formatted)
}

