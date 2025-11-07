// API Configuration Constants
// BASE_URL comes from environment variable NEXT_PUBLIC_API_BASE_URL

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export const API_URLS = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  REFRESH_TOKEN: "/auth/refresh",
  ME: "/me",
  PROFILE_IMAGE: "/profile/image",
  CUSTOMER_ORDERS: "/customers/orders",
  ORDER_DETAILS: "/customers/orders",
  ORDER_TRACKING: "/orders/track",
  NAVIGATION_DIRECTIONS: "/navigation/directions",
  WALLETS: "/customers/wallet",
  WALLET_TRANSACTIONS: "/customers/wallet/transactions",
  MULTIRECIPIENT_ORDERS: "/orders/multi-recipient",
  AGENT_OFFICES: "/agent-offices",
  AGENT_OFFICES_NEARBY: "/agent-offices/nearby-by-location",
  DELIVERY_WINDOWS: "/delivery-windows",
  MARK_ORDER_AS_PAID: "/orders", // Base path, order_id appended in service
  GEOCODE: "/locations/geocode",
} as const

/**
 * Internal API route constants (for client-side calls to Next.js API routes)
 */
export const INTERNAL_API_URLS = {
  AUTH_LOGIN: "/api/auth/login",
  AUTH_REGISTER: "/api/auth/register",
  AUTH_REFRESH: "/api/auth/refresh",
  ME: "/api/me",
  PROFILE_IMAGE: "/api/profile/image",
  ORDERS: "/api/orders",
  ORDERS_TRACKING: "/api/orders/tracking",
  WALLET: "/api/wallet",
  WALLET_TRANSACTIONS: "/api/wallet/transactions",
  AGENT_OFFICES: "/api/agent-offices",
  AGENT_OFFICES_NEARBY: "/api/agent-offices/nearby-by-location",
  GEOCODE: "/api/locations/geocode",
  NAVIGATION_DIRECTIONS: "/api/navigation/directions",
  DELIVERY_WINDOWS: "/api/delivery-windows",
} as const

/**
 * Helper function to get full API URL by combining BASE_URL with a path
 * @param path - API endpoint path (should start with /)
 * @returns Full URL string
 * @note Only use this in server-side code (API route handlers). Clients should use INTERNAL_API_URLS.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  const cleanBase = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL
  return `${cleanBase}${cleanPath}`
}

/**
 * Helper to get full internal API URL (for server-side calls to Next.js API routes)
 * Uses NEXTAUTH_URL or constructs from request origin
 * @param path - Internal API route path (should start with /)
 * @returns Full URL string
 */
export function getInternalApiUrl(path: string): string {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base
  return `${cleanBase}${cleanPath}`
}
