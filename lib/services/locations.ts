import { INTERNAL_API_URLS } from "@/lib/constants"

export interface GeocodeResult {
  display_name: string
  latitude: number
  longitude: number
  address: {
    city?: string
    county?: string
    state?: string
    country?: string
    country_code?: string
    road?: string
    house_number?: string
    neighbourhood?: string
    village?: string
    shop?: string
    building?: string
    [key: string]: string | undefined
  }
  importance: number
  place_id: number
}

export interface GeocodeResponse {
  results: GeocodeResult[]
  query: string
  country: string
  count: number
}

export interface GeocodeParams {
  query: string
  country: string
  limit?: number
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Geocodes a location query to find coordinates and address details
 * @param params - Parameters including query, country, limit, tokens, and token update callback
 * @returns GeocodeResponse with results or null on error
 */
export async function geocodeLocation(
  params: GeocodeParams
): Promise<GeocodeResponse | null> {
  const { query, country, limit = 5, accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.GEOCODE

    const payload = {
      query,
      country,
      limit,
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[locations.geocodeLocation] POST", url)
      console.log("[locations.geocodeLocation] payload", { query, country, limit })
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[locations.geocodeLocation] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[locations.geocodeLocation] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[locations.geocodeLocation] error", errorData)
      }

      return null
    }

    const data: GeocodeResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[locations.geocodeLocation] success", {
        count: data?.count ?? 0,
        results: data?.results?.length ?? 0,
      })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[locations.geocodeLocation] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return null
  }
}

export interface ReverseGeocodeParams {
  latitude: number
  longitude: number
  country: string
  zoom?: number
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Reverse geocodes coordinates to get address details
 * @param params - Parameters including latitude, longitude, country, zoom, tokens, and token update callback
 * @returns GeocodeResult or null on error
 */
export async function reverseGeocodeLocation(
  params: ReverseGeocodeParams
): Promise<GeocodeResult | null> {
  const { latitude, longitude, country, zoom = 18, accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.REVERSE_GEOCODE

    // Ensure coordinates are limited to 9 decimal places before sending
    const payload = {
      latitude: parseFloat(latitude.toFixed(9)),
      longitude: parseFloat(longitude.toFixed(9)),
      country,
      zoom,
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[locations.reverseGeocodeLocation] POST", url)
      console.log("[locations.reverseGeocodeLocation] payload", payload)
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[locations.reverseGeocodeLocation] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[locations.reverseGeocodeLocation] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[locations.reverseGeocodeLocation] error", errorData)
      }

      return null
    }

    const data = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[locations.reverseGeocodeLocation] success", {
        display_name: data?.display_name,
      })
    }

    // Transform API response to GeocodeResult format
    // Ensure coordinates are limited to 9 decimal places
    const resultLat = data.latitude || latitude
    const resultLng = data.longitude || longitude
    const result: GeocodeResult = {
      display_name: data.display_name || `${latitude}, ${longitude}`,
      latitude: parseFloat(resultLat.toFixed(9)),
      longitude: parseFloat(resultLng.toFixed(9)),
      address: {
        city: data.address?.city,
        county: data.address?.county || data.address?.state,
        state: data.address?.state,
        country: data.address?.country,
        country_code: data.address?.country_code?.toUpperCase(),
        road: data.address?.road,
        house_number: data.address?.house_number,
        neighbourhood: data.address?.neighbourhood || data.address?.suburb || data.address?.city_block,
        village: data.address?.village,
        shop: data.address?.shop,
        building: data.address?.building,
      },
      importance: 0, // API doesn't return importance
      place_id: data.place_id || 0,
    }

    return result
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[locations.reverseGeocodeLocation] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return null
  }
}

