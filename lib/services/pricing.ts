import { INTERNAL_API_URLS } from "@/lib/constants"
import { formatCoordinates } from "@/lib/utils/coordinates"

export interface CalculatePricingParams {
  pickup_latitude: number
  pickup_longitude: number
  delivery_latitude: number
  delivery_longitude: number
  service_type: "waka"
  service_level: "standard" | "express"
  weight: number
  country: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface PricingResponse {
  base_fee: number
  distance_fee: number
  weight_fee: number
  service_fee: number
  total_fee: number
  distance_km: number
  service_type: string
  service_level: string
}

/**
 * Calculate pricing for a delivery
 * @param params - Parameters including coordinates, service type, weight, and tokens
 * @returns PricingResponse with fee breakdown or null on error
 * @throws Error if token refresh fails
 */
export async function calculatePricing(
  params: CalculatePricingParams
): Promise<PricingResponse | null> {
  const {
    pickup_latitude,
    pickup_longitude,
    delivery_latitude,
    delivery_longitude,
    service_type,
    service_level,
    weight,
    country,
    accessToken,
    refreshToken,
    onTokenUpdate,
  } = params

  try {
    const url = INTERNAL_API_URLS.PRICING_CALCULATE

    // Format coordinates: max 9 digits total, max 6 decimal places
    const formattedPickup = formatCoordinates([pickup_latitude, pickup_longitude])
    const formattedDelivery = formatCoordinates([delivery_latitude, delivery_longitude])

    const payload = {
      pickup_latitude: formattedPickup[0],
      pickup_longitude: formattedPickup[1],
      delivery_latitude: formattedDelivery[0],
      delivery_longitude: formattedDelivery[1],
      service_type,
      service_level,
      weight,
      country,
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[pricing.calculatePricing] POST", url)
      console.log("[pricing.calculatePricing] payload", payload)
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[pricing.calculatePricing] status", response.status)
    }

    if (!response.ok) {
      // Handle 401 Unauthorized - try token refresh
      if (response.status === 401) {
        try {
          const refreshResponse = await fetch(INTERNAL_API_URLS.AUTH_REFRESH, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
          })

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            const newAccessToken = refreshData.access
            const newRefreshToken = refreshData.refresh || refreshToken

            await onTokenUpdate(newAccessToken, newRefreshToken)

            // Retry the request with new token
            const retryResponse = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            })

            if (!retryResponse.ok) {
              let errorData: any = {}
              let errorText = ""
              try {
                const contentType = retryResponse.headers.get("content-type")
                if (contentType?.includes("application/json")) {
                  errorData = await retryResponse.json()
                } else {
                  errorText = await retryResponse.text()
                }
              } catch (parseError) {
                if (process.env.NODE_ENV !== "production") {
                  console.error("[pricing.calculatePricing] failed to parse error response", parseError)
                }
              }

              const errorMessage =
                errorData.detail || errorData.message || errorText || "Failed to calculate pricing."
              throw new Error(errorMessage)
            }

            const data: PricingResponse = await retryResponse.json()
            return data
          } else {
            throw new Error("Token refresh failed")
          }
        } catch (refreshError) {
          if (refreshError instanceof Error && refreshError.message === "Token refresh failed") {
            throw refreshError
          }
          throw new Error("Token refresh failed")
        }
      }

      let errorData: any = {}
      let errorText = ""
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[pricing.calculatePricing] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[pricing.calculatePricing] error", errorData)
      }

      const errorMessage =
        errorData.detail || errorData.message || errorText || "Failed to calculate pricing."
      throw new Error(errorMessage)
    }

    const data: PricingResponse = await response.json()
    return data
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[pricing.calculatePricing] exception", error)
    }

    if (error instanceof Error && error.message === "Token refresh failed") {
      throw error
    }

    throw new Error(error instanceof Error ? error.message : "Failed to calculate pricing.")
  }
}

