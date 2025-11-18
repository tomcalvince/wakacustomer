/**
 * Recursively parses stringified JSON values in an object
 * This is useful when API responses contain JSON strings that need to be parsed
 * @param obj - The object to parse
 * @returns The object with parsed JSON strings converted to their proper types
 */
export function parseStringifiedJson<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  // If it's a string, try to parse it as JSON
  if (typeof obj === "string") {
    // Check if it looks like a JSON string (starts with {, [, or " and is longer than a simple value)
    const trimmed = obj.trim()
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2)
    ) {
      try {
        const parsed = JSON.parse(obj)
        // Recursively parse the parsed value in case it contains more stringified JSON
        return parseStringifiedJson(parsed)
      } catch {
        // If parsing fails, return the original string
        return obj
      }
    }
    return obj
  }

  // If it's an array, parse each element
  if (Array.isArray(obj)) {
    return obj.map((item) => parseStringifiedJson(item)) as T
  }

  // If it's an object, parse each property
  if (typeof obj === "object") {
    const parsed: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        parsed[key] = parseStringifiedJson((obj as any)[key])
      }
    }
    return parsed as T
  }

  // For primitives (number, boolean, etc.), return as-is
  return obj
}

/**
 * Converts string numeric values to numbers for specific fields
 * @param obj - The object to convert
 * @param numericFields - Array of field names that should be converted to numbers
 * @returns The object with specified fields converted to numbers
 */
export function convertNumericFields<T>(
  obj: T,
  numericFields: string[]
): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  // If it's an array, convert each element
  if (Array.isArray(obj)) {
    return obj.map((item) => convertNumericFields(item, numericFields)) as T
  }

  // If it's an object, convert specified fields
  if (typeof obj === "object") {
    const converted: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as any)[key]
        // If this field should be numeric and the value is a string that looks like a number
        if (
          numericFields.includes(key) &&
          typeof value === "string" &&
          value.trim() !== "" &&
          !isNaN(Number(value)) &&
          isFinite(Number(value))
        ) {
          converted[key] = Number(value)
        } else {
          // Recursively process nested objects/arrays
          converted[key] = convertNumericFields(value, numericFields)
        }
      }
    }
    return converted as T
  }

  return obj
}

/**
 * Comprehensive parser that handles both stringified JSON and numeric conversions
 * @param obj - The object to parse
 * @param numericFields - Optional array of field names that should be converted to numbers
 * @returns The fully parsed and converted object
 */
export function parseApiResponse<T>(
  obj: T,
  numericFields: string[] = []
): T {
  // First parse any stringified JSON
  let parsed = parseStringifiedJson(obj)
  
  // Then convert numeric fields if specified
  if (numericFields.length > 0) {
    parsed = convertNumericFields(parsed, numericFields)
  }
  
  return parsed
}

