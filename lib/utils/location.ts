/**
 * Location utilities for getting user's current location and country
 */

export interface UserLocation {
  latitude: number
  longitude: number
  countryCode?: string
}

/**
 * Request location permission and get user's current location
 * @returns Promise with user's coordinates
 * @throws Error if permission denied or location unavailable
 */
export async function getUserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        let message = "Unable to retrieve your location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied"
            break
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable"
            break
          case error.TIMEOUT:
            message = "Location request timed out"
            break
        }
        reject(new Error(message))
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000, // Accept cached position up to 1 minute old
      }
    )
  })
}

/**
 * Get country code from coordinates using a simple approximation
 * For more accuracy, would need a reverse geocoding service
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Country code (e.g., "KE", "UG") or undefined if unable to determine
 */
export function getCountryFromCoordinates(
  latitude: number,
  longitude: number
): string | undefined {
  // Simple approximation based on coordinate ranges
  // Kenya: approximately -4.7 to -1.0 lat, 33.9 to 41.9 lon
  if (latitude >= -4.7 && latitude <= -1.0 && longitude >= 33.9 && longitude <= 41.9) {
    return "KE"
  }

  // Uganda: approximately -1.5 to 4.2 lat, 29.6 to 35.0 lon
  if (latitude >= -1.5 && latitude <= 4.2 && longitude >= 29.6 && longitude <= 35.0) {
    return "UG"
  }

  // Default to Kenya if coordinates are close but uncertain
  if (latitude >= -5.0 && latitude <= 5.0 && longitude >= 29.0 && longitude <= 42.0) {
    return "KE" // Default fallback
  }

  return undefined
}

/**
 * Check if location permission is granted
 * Note: This is an approximation as browser APIs don't directly expose permission status
 * @returns Promise resolving to true if likely granted, false otherwise
 */
export async function checkLocationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      (error) => {
        // Permission denied or other error
        resolve(false)
      },
      {
        timeout: 1000,
        maximumAge: Infinity,
      }
    )
  })
}

