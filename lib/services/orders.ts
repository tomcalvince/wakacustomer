import { INTERNAL_API_URLS } from "@/lib/constants"
import {
  Order,
  OrderDetails,
  OrderDirection,
  OrderStatus,
  TrackingData,
  DirectionsResponse,
} from "@/types/orders"

export interface FetchOrdersParams {
  direction?: OrderDirection
  status?: OrderStatus
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface PaginatedOrdersResponse {
  count: number
  next: string | null
  previous: string | null
  results: Order[]
}

export interface FetchOrdersPageParams {
  nextUrl?: string | null
  direction?: OrderDirection
  status?: OrderStatus
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches a page of orders from the API with optional filtering
 * @param params - Parameters including optional nextUrl, tokens, optional filters, and token update callback
 * @returns PaginatedOrdersResponse with orders and pagination metadata
 */
export async function fetchOrdersPage(
  params: FetchOrdersPageParams
): Promise<PaginatedOrdersResponse> {
  const { nextUrl, accessToken, refreshToken, direction, status, onTokenUpdate } = params

  let url: string
  if (nextUrl) {
    // Use the next URL directly (it should be a full URL or relative path)
    url = nextUrl.startsWith("http") ? nextUrl : `${INTERNAL_API_URLS.ORDERS}${nextUrl}`
  } else {
    // Build query parameters
    const queryParams = new URLSearchParams()
    if (direction && direction !== "all") {
      queryParams.append("direction", direction)
    }
    if (status && status !== "all") {
      queryParams.append("status", status)
    }
    url = `${INTERNAL_API_URLS.ORDERS}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  }

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrdersPage] GET", url)
      console.log("[orders.fetchOrdersPage] filters", { direction, status, nextUrl: !!nextUrl })
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrdersPage] status", response.status)
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
          console.error("[orders.fetchOrdersPage] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        const logData: any = {
          url: url || "unknown",
          status: response?.status ?? "unknown",
          statusText: response?.statusText ?? "unknown",
        }
        
        if (errorData && typeof errorData === "object" && Object.keys(errorData).length > 0) {
          logData.errorData = errorData
        }
        
        if (errorText && typeof errorText === "string" && errorText.trim().length > 0) {
          logData.errorText = errorText.substring(0, 500)
        }
        
        console.error("[orders.fetchOrdersPage] error", logData)
      }

      // Return empty paginated response on error
      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      }
    }

    const data: PaginatedOrdersResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrdersPage] success", {
        count: data?.count ?? 0,
        resultsCount: data?.results?.length ?? 0,
        hasNext: !!data?.next,
        hasPrevious: !!data?.previous,
      })
    }

    return {
      count: data?.count ?? 0,
      next: data?.next ?? null,
      previous: data?.previous ?? null,
      results: data?.results || [],
    }
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      const errorInfo: any = {
        url,
        message: error?.message || "Unknown error",
        name: error?.name || "Error",
      }
      
      if (error?.code) {
        errorInfo.code = error.code
      }
      
      if (error?.cause) {
        errorInfo.cause = error.cause
      }
      
      if (error?.stack) {
        errorInfo.stack = error.stack
      }
      
      console.error("[orders.fetchOrdersPage] exception", errorInfo)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return empty paginated response on other errors
    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    }
  }
}

/**
 * Fetches orders from the API with optional filtering
 * @param params - Parameters including tokens, optional filters, and token update callback
 * @returns Array of orders or empty array on error
 * @deprecated Use fetchOrdersPage for pagination support
 */
export async function fetchOrders(params: FetchOrdersParams): Promise<Order[]> {
  const paginatedResponse = await fetchOrdersPage(params)
  return paginatedResponse.results
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
    const url = `${INTERNAL_API_URLS.ORDERS}/${orderId}`

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrderDetails] GET", url)
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrderDetails] status", response.status)
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
          console.error("[orders.fetchOrderDetails] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        const logData: any = {
          url,
          status: response?.status ?? "unknown",
          statusText: response?.statusText ?? "unknown",
        }
        
        if (Object.keys(errorData).length > 0) {
          logData.errorData = errorData
        }
        
        if (errorText) {
          logData.errorText = errorText.substring(0, 500) // Limit length
        }
        
        // Only log if we have meaningful data
        if (logData.status !== "unknown" || logData.errorData || logData.errorText) {
          console.error("[orders.fetchOrderDetails] error", logData)
        }
      }

      // Return null on error instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data: OrderDetails = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchOrderDetails] success", { orderId: data?.id })
    }

    return data || null
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      const errorInfo: any = {
        url: `${INTERNAL_API_URLS.ORDERS}/${orderId}`,
        message: error?.message || "Unknown error",
        name: error?.name || "Error",
      }
      
      if (error?.code) {
        errorInfo.code = error.code
      }
      
      if (error?.cause) {
        errorInfo.cause = error.cause
      }
      
      if (error?.stack) {
        errorInfo.stack = error.stack
      }
      
      console.error("[orders.fetchOrderDetails] exception", errorInfo)
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
    const url = `${INTERNAL_API_URLS.ORDERS_TRACKING}/${trackingNumber}`

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchTrackingData] GET", url)
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchTrackingData] status", response.status)
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
          console.error("[orders.fetchTrackingData] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        const logData: any = {
          url,
          status: response?.status ?? "unknown",
          statusText: response?.statusText ?? "unknown",
        }
        
        if (Object.keys(errorData).length > 0) {
          logData.errorData = errorData
        }
        
        if (errorText) {
          logData.errorText = errorText.substring(0, 500) // Limit length
        }
        
        // Only log if we have meaningful data
        if (logData.status !== "unknown" || logData.errorData || logData.errorText) {
          console.error("[orders.fetchTrackingData] error", logData)
        }
      }

      // Return null on error instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data: TrackingData = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchTrackingData] success", { trackingNumber: data?.tracking_number })
    }

    return data || null
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      const errorInfo: any = {
        url: `${INTERNAL_API_URLS.ORDERS_TRACKING}/${trackingNumber}`,
        message: error?.message || "Unknown error",
        name: error?.name || "Error",
      }
      
      if (error?.code) {
        errorInfo.code = error.code
      }
      
      if (error?.cause) {
        errorInfo.cause = error.cause
      }
      
      if (error?.stack) {
        errorInfo.stack = error.stack
      }
      
      console.error("[orders.fetchTrackingData] exception", errorInfo)
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
    const url = INTERNAL_API_URLS.NAVIGATION_DIRECTIONS

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchDirections] POST", url)
      console.log("[orders.fetchDirections] payload", {
        start_latitude,
        start_longitude,
        end_latitude,
        end_longitude,
        country,
        user_type,
      })
    }

    const response = await fetch(url, {
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
    })

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
    const url = INTERNAL_API_URLS.DELIVERY_WINDOWS

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.fetchDeliveryWindows] GET", url)
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

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
  declared_value?: number
  recipient_name: string
  recipient_phone: string
  destination_agent_office: string
  special_instructions?: string
}

export interface CreateMultiRecipientOrderParams {
  origin_agent_office: string
  sender_name: string
  sender_phone: string
  service_option: "drop-off"
  service_level: "standard" | "express"
  delivery_time: string
  parcels: ParcelPayload[]
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface CreateMultiRecipientOrderResponse {
  id: string
  order_number: string
  total_fee: string
  payment_status: string
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
    service_level,
    delivery_time,
    parcels,
    accessToken,
    refreshToken,
    onTokenUpdate,
  } = params

  try {
    const url = INTERNAL_API_URLS.WAKA_ORDERS

    const payload = {
      origin_agent_office,
      sender_name,
      sender_phone,
      service_option,
      service_level,
      delivery_time,
      parcels,
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.createMultiRecipientOrder] POST", url)
      console.log("[orders.createMultiRecipientOrder] payload", {
        origin_agent_office,
        sender_name,
        sender_phone,
        service_option,
        service_level,
        delivery_time,
        parcels_count: parcels.length,
      })
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

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

      // Check for insufficient wallet balance error
      if (errorData.detail === "Insufficient wallet balance") {
        // Throw a special error with the wallet balance details
        const walletError = new Error("INSUFFICIENT_WALLET_BALANCE")
        ;(walletError as any).errorData = errorData
        throw walletError
      }

      // Return null on other errors instead of throwing (unless it's a token refresh failure)
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
    const url = `${INTERNAL_API_URLS.ORDERS}/${orderId}/mark-as-paid`

    const payload = {
      amount,
      notes: notes || "",
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.markOrderAsPaid] POST", url)
      console.log("[orders.markOrderAsPaid] payload", { amount, notes })
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

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

export interface DoorToDoorParcelPayload {
  parcel_name: string
  estimated_weight: number
  size: string
  declared_value?: number
  cod?: boolean
  cod_amount?: number
}

export interface CreateDoorToDoorOrderParams {
  sender: string
  sender_phone: string
  pickup_address: string
  pickup_coordinates: [number, number]
  delivery_address: string
  delivery_coordinates: [number, number]
  delivery_time: string
  service_level: "standard"
  parcels: DoorToDoorParcelPayload[]
  recipient_name: string
  recipient_phone: string
  special_instructions?: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface CreateDoorToDoorOrderResponse {
  id: string
  order_number: string
  total_fee: string
  payment_status: string
}

/**
 * Creates a door-to-door order
 * @param params - Parameters including order data, tokens, and token update callback
 * @returns Created order response or null on error
 * @throws Error if token refresh fails
 */
export async function createDoorToDoorOrder(
  params: CreateDoorToDoorOrderParams
): Promise<CreateDoorToDoorOrderResponse | null> {
  const {
    sender,
    sender_phone,
    pickup_address,
    pickup_coordinates,
    delivery_address,
    delivery_coordinates,
    delivery_time,
    parcels,
    recipient_name,
    recipient_phone,
    special_instructions,
    accessToken,
    refreshToken,
    onTokenUpdate,
  } = params

  try {
    const url = `${INTERNAL_API_URLS.ORDERS}/door-to-door`

    const payload = {
      sender,
      sender_phone,
      pickup_address,
      pickup_coordinates,
      delivery_address,
      delivery_coordinates,
      delivery_time,
      service_level: "standard",
      parcels,
      recipient_name,
      recipient_phone,
      special_instructions: special_instructions || "",
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.createDoorToDoorOrder] POST", url)
      console.log("[orders.createDoorToDoorOrder] payload", {
        sender,
        sender_phone,
        pickup_address,
        delivery_address,
        delivery_time,
        parcels_count: parcels.length,
      })
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.createDoorToDoorOrder] status", response.status)
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
            "[orders.createDoorToDoorOrder] failed to parse error response",
            parseError
          )
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[orders.createDoorToDoorOrder] error", errorData)
      }

      // Check for insufficient wallet balance error
      if (errorData.detail === "Insufficient wallet balance") {
        // Throw a special error with the wallet balance details
        const walletError = new Error("INSUFFICIENT_WALLET_BALANCE")
        ;(walletError as any).errorData = errorData
        throw walletError
      }

      // Return null on other errors instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data: CreateDoorToDoorOrderResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[orders.createDoorToDoorOrder] success", { order_number: data?.order_number })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[orders.createDoorToDoorOrder] exception", error)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return null on other errors
    return null
  }
}
