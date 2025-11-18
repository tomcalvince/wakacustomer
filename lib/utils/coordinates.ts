/**
 * Format coordinate to ensure:
 * - Maximum 9 digits total (including before and after decimal point)
 * - Maximum 6 decimal places
 * 
 * @param coordinate - The coordinate value (latitude or longitude)
 * @returns Formatted coordinate as a number
 * 
 * @example
 * formatCoordinate(123.456789) // 123.456789 (9 digits, 6 decimals) ✓
 * formatCoordinate(1234.56789) // 1234.56789 → 1234.567 (9 digits, 3 decimals)
 * formatCoordinate(123.4567890) // 123.456789 (6 decimals max)
 */
export function formatCoordinate(coordinate: number): number {
  // First, round to 6 decimal places
  let rounded = parseFloat(coordinate.toFixed(6))
  
  // Convert to string to count digits
  const str = rounded.toString()
  const digitsOnly = str.replace(/[.-]/g, '')
  
  // If total digits > 9, reduce precision
  if (digitsOnly.length > 9) {
    // Calculate how many digits we need to remove
    const excessDigits = digitsOnly.length - 9
    
    // Determine integer part length
    const integerPart = Math.floor(Math.abs(rounded))
    const integerDigits = integerPart.toString().length
    
    // Calculate available decimal places (9 - integer digits)
    const maxDecimalPlaces = Math.max(0, 9 - integerDigits)
    
    // Round to the calculated decimal places
    rounded = parseFloat(rounded.toFixed(maxDecimalPlaces))
  }
  
  return rounded
}

/**
 * Format a coordinate pair [latitude, longitude] to ensure both coordinates
 * meet the requirements: max 9 digits total, max 6 decimal places
 * 
 * @param coordinates - Array of [latitude, longitude]
 * @returns Formatted coordinates as [number, number]
 */
export function formatCoordinates(coordinates: [number, number]): [number, number] {
  return [
    formatCoordinate(coordinates[0]),
    formatCoordinate(coordinates[1]),
  ]
}

