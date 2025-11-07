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

