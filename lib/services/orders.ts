import { getApiUrl, API_URLS } from "@/lib/constants"
import {
  Order,
  OrderDetails,
  OrderDirection,
  OrderStatus,
  TrackingData,
  DirectionsResponse,
} from "@/types/orders"
import { fetchWithAuth } from "./api-client"

export interface FetchOrdersParams {
  direction?: OrderDirection
  status?: OrderStatus
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches orders from the API with optional filtering
 * @param params - Parameters including tokens, optional filters, and token update callback
 * @returns Array of orders or empty array on error
 */
export async function fetchOrders(params: FetchOrdersParams): Promise<Order[]> {
  const { accessToken, refreshToken, direction, status, onTokenUpdate } = params

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrders] GET", getApiUrl(API_URLS.AGENT_ORDERS))
      console.log("[orders.fetchOrders] filters", { direction, status })
    }

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (direction && direction !== "all") {
      queryParams.append("direction", direction)
    }
    if (status && status !== "all") {
      queryParams.append("status", status)
    }

    const url = `${getApiUrl(API_URLS.AGENT_ORDERS)}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`

    const response = await fetchWithAuth(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
      refreshToken,
      onTokenUpdate
    )

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrders] status", response.status)
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
          console.error("[orders.fetchOrders] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[orders.fetchOrders] error", errorData)
      }

      // Return empty array on error instead of throwing
      return []
    }

    const data: Order[] = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrders] success", { count: data?.length ?? 0 })
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders.fetchOrders] exception", error)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return empty array on other errors
    return []
  }
}

export interface FetchOrderDetailsParams {
  orderId: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches order details from the API
 * @param params - Parameters including orderId, tokens, and token update callback
 * @returns OrderDetails object or null on error
 * @throws Error if token refresh fails
 */
export async function fetchOrderDetails(
  params: FetchOrderDetailsParams
): Promise<OrderDetails | null> {
  const { orderId, accessToken, refreshToken, onTokenUpdate } = params

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrderDetails] GET", `${getApiUrl(API_URLS.ORDER_DETAILS)}/${orderId}`)
    }

    const url = `${getApiUrl(API_URLS.ORDER_DETAILS)}/${orderId}`

    const response = await fetchWithAuth(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
      refreshToken,
      onTokenUpdate
    )

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrderDetails] status", response.status)
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
          console.error("[orders.fetchOrderDetails] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[orders.fetchOrderDetails] error", errorData)
      }

      // Return null on error instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data: OrderDetails = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrderDetails] success", { orderId: data?.id })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders.fetchOrderDetails] exception", error)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return null on other errors
    return null
  }
}

export interface FetchTrackingDataParams {
  trackingNumber: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches tracking data from the API
 * @param params - Parameters including trackingNumber, tokens, and token update callback
 * @returns TrackingData object or null on error
 * @throws Error if token refresh fails
 */
export async function fetchTrackingData(
  params: FetchTrackingDataParams
): Promise<TrackingData | null> {
  const { trackingNumber, accessToken, refreshToken, onTokenUpdate } = params

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[orders.fetchTrackingData] GET",
        `${getApiUrl(API_URLS.ORDER_TRACKING)}/${trackingNumber}`
      )
    }

    const url = `${getApiUrl(API_URLS.ORDER_TRACKING)}/${trackingNumber}`

    const response = await fetchWithAuth(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
      refreshToken,
      onTokenUpdate
    )

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchTrackingData] status", response.status)
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
          console.error("[orders.fetchTrackingData] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[orders.fetchTrackingData] error", errorData)
      }

      // Return null on error instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data: TrackingData = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchTrackingData] success", { trackingNumber: data?.tracking_number })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders.fetchTrackingData] exception", error)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return null on other errors
    return null
  }
}

export interface FetchDirectionsParams {
  start_latitude: number
  start_longitude: number
  end_latitude: number
  end_longitude: number
  country: string
  user_type: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches navigation directions from the API
 * @param params - Parameters including coordinates, country, user_type, tokens, and token update callback
 * @returns DirectionsResponse object or null on error
 * @throws Error if token refresh fails
 */
export async function fetchDirections(
  params: FetchDirectionsParams
): Promise<DirectionsResponse | null> {
  const {
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
    country,
    user_type,
    accessToken,
    refreshToken,
    onTokenUpdate,
  } = params

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchDirections] POST", getApiUrl(API_URLS.NAVIGATION_DIRECTIONS))
      console.log("[orders.fetchDirections] payload", {
        start_latitude,
        start_longitude,
        end_latitude,
        end_longitude,
        country,
        user_type,
      })
    }

    const url = getApiUrl(API_URLS.NAVIGATION_DIRECTIONS)

    const response = await fetchWithAuth(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_latitude,
          start_longitude,
          end_latitude,
          end_longitude,
          country,
          user_type,
        }),
      },
      accessToken,
      refreshToken,
      onTokenUpdate
    )

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchDirections] status", response.status)
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
          console.error("[orders.fetchDirections] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[orders.fetchDirections] error", errorData)
      }

      // Return null on error instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data: DirectionsResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchDirections] success", {
        total_distance: data?.total_distance,
        total_duration: data?.total_duration,
        steps: data?.directions?.length ?? 0,
      })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders.fetchDirections] exception", error)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return null on other errors
    return null
  }
}

export interface DeliveryWindow {
  id: string
  name: string
  window_type: string
  window_type_display: string
  start_time: string
  end_time: string
  is_active: boolean
  max_capacity: number
  current_bookings: number
  base_price: string
  premium_price: string
}

export interface FetchDeliveryWindowsParams {
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches available delivery windows from the API
 * @param params - Parameters including tokens and token update callback
 * @returns Array of delivery windows or empty array on error
 */
export async function fetchDeliveryWindows(
  params: FetchDeliveryWindowsParams
): Promise<DeliveryWindow[]> {
  const { accessToken, refreshToken, onTokenUpdate } = params

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchDeliveryWindows] GET", getApiUrl(API_URLS.DELIVERY_WINDOWS))
    }

    const url = getApiUrl(API_URLS.DELIVERY_WINDOWS)

    const response = await fetchWithAuth(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
      refreshToken,
      onTokenUpdate
    )

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchDeliveryWindows] status", response.status)
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
          console.error(
            "[orders.fetchDeliveryWindows] failed to parse error response",
            parseError
          )
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[orders.fetchDeliveryWindows] error", errorData)
      }

      return []
    }

    const data: DeliveryWindow[] = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchDeliveryWindows] success", { count: data?.length ?? 0 })
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders.fetchDeliveryWindows] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return []
  }
}

export interface ParcelPayload {
  parcel_name: string
  estimated_weight: number
  size: string
  declared_value: number
  recipient_name: string
  recipient_phone: string
  destination_agent_office: string
  special_instructions?: string
}

export interface CreateMultiRecipientOrderParams {
  origin_agent_office: string
  sender_name: string
  sender_phone: string
  service_option: "drop-off" | "express"
  delivery_time: string
  parcels: ParcelPayload[]
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface CreateMultiRecipientOrderResponse {
  id: string
  order_number: string
  tracking_number: string
  status: string
  payment_status: string
  payment_method: string | null
  paid_at: string | null
  service_type: string
  service_option: string
  delivery_time: string
  total_weight: string
  total_value: string
  base_fee: string
  distance_fee: string
  weight_fee: string
  service_fee: string
  total_fee: string
  sender_name: string
  sender_phone: string
  pickup_latitude: string
  pickup_longitude: string
  pickup_location: string
  pickup_address: string
  pickup_country: string
  delivery_latitude: string
  delivery_longitude: string
  delivery_location: string
  delivery_address: string
  delivery_country: string
  route_distance_meters: number
  route_duration_seconds: number
  route_polyline: string
  created_at: string
  scheduled_delivery: string | null
  picked_up_at: string | null
  delivered_at: string | null
  special_instructions: string
  requires_signature: boolean
  requires_id_verification: boolean
  customer: string
  agent: string
  rider: string | null
  origin_agent_office: string
  destination_agent_office: string | null
}

/**
 * Creates a multi-recipient order
 * @param params - Parameters including order data, tokens, and token update callback
 * @returns Created order response or null on error
 * @throws Error if token refresh fails
 */
export async function createMultiRecipientOrder(
  params: CreateMultiRecipientOrderParams
): Promise<CreateMultiRecipientOrderResponse | null> {
  const {
    origin_agent_office,
    sender_name,
    sender_phone,
    service_option,
    delivery_time,
    parcels,
    accessToken,
    refreshToken,
    onTokenUpdate,
  } = params

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[orders.createMultiRecipientOrder] POST",
        getApiUrl(API_URLS.MULTIRECIPIENT_ORDERS)
      )
      console.log("[orders.createMultiRecipientOrder] payload", {
        origin_agent_office,
        sender_name,
        sender_phone,
        service_option,
        delivery_time,
        parcels_count: parcels.length,
      })
    }

    const url = getApiUrl(API_URLS.MULTIRECIPIENT_ORDERS)

    const payload = {
      origin_agent_office,
      sender_name,
      sender_phone,
      service_type: "waka-agent",
      service_option,
      delivery_time,
      parcels,
    }

    const response = await fetchWithAuth(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      accessToken,
      refreshToken,
      onTokenUpdate
    )

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.createMultiRecipientOrder] status", response.status)
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
          console.error(
            "[orders.createMultiRecipientOrder] failed to parse error response",
            parseError
          )
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[orders.createMultiRecipientOrder] error", errorData)
      }

      // Return null on error instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data: CreateMultiRecipientOrderResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.createMultiRecipientOrder] success", { order_number: data?.order_number })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders.createMultiRecipientOrder] exception", error)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return null on other errors
    return null
  }
}


export interface MarkOrderAsPaidParams {
  orderId: string
  amount: string
  notes: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface MarkOrderAsPaidResponse {
  message: string
  order_id: string
  order_number: string
  payment_id: string
  amount: string
  payment_method: string
  payment_status: string
  paid_at: string
  transaction_id: string
  remaining_balance: string
}

/**
 * Mark an order as paid
 * @param params - Parameters including orderId, amount, notes, tokens, and token update callback
 * @returns MarkOrderAsPaidResponse with payment details
 * @throws Error if payment fails or amount doesn't match order total
 */
export async function markOrderAsPaid(
  params: MarkOrderAsPaidParams
): Promise<MarkOrderAsPaidResponse> {
  const { orderId, amount, notes, accessToken, refreshToken, onTokenUpdate } = params

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[orders.markOrderAsPaid] POST",
        `${getApiUrl(API_URLS.MARK_ORDER_AS_PAID)}/${orderId}/mark-as-paid`
      )
      console.log("[orders.markOrderAsPaid] payload", { amount, notes })
    }

    const url = `${getApiUrl(API_URLS.MARK_ORDER_AS_PAID)}/${orderId}/mark-as-paid`

    const payload = {
      amount,
      notes: notes || "",
    }

    const response = await fetchWithAuth(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      accessToken,
      refreshToken,
      onTokenUpdate
    )

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.markOrderAsPaid] status", response.status)
    }

    if (!response.ok) {
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
          console.error("[orders.markOrderAsPaid] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[orders.markOrderAsPaid] error", errorData)
      }

      // Handle specific error messages
      const errorMessage =
        errorData.detail || errorData.message || errorText || "Failed to mark order as paid."
      throw new Error(errorMessage)
    }

    const data: MarkOrderAsPaidResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.markOrderAsPaid] success", {
        order_id: data?.order_id,
        order_number: data?.order_number,
        amount: data?.amount,
      })
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders.markOrderAsPaid] exception", error)
    }
    // Re-throw error to let component handle it
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred while marking order as paid.")
  }
}
