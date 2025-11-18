import useSWR from "swr"
import { useSession } from "next-auth/react"
import { fetchOrders, fetchOrdersPage, type PaginatedOrdersResponse } from "@/lib/services/orders"
import type { Order, OrderDirection, OrderStatus } from "@/types/orders"

/**
 * SWR fetcher function for orders (first page)
 */
async function ordersFetcher(
  url: string,
  direction: OrderDirection,
  status: OrderStatus,
  accessToken: string,
  refreshToken: string,
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
): Promise<PaginatedOrdersResponse> {
  return fetchOrdersPage({
    direction,
    status,
    accessToken,
    refreshToken,
    onTokenUpdate,
  })
}

/**
 * Hook to fetch orders using SWR with pagination support
 */
export function useOrders(direction: OrderDirection = "all", status: OrderStatus = "all") {
  const { data: session, update: updateSession } = useSession()
  
  const { data, error, isLoading, mutate } = useSWR(
    session?.accessToken && session?.refreshToken
      ? ["orders", direction, status, session.accessToken, session.refreshToken]
      : null,
    ([, direction, status, accessToken, refreshToken]) =>
      ordersFetcher("orders", direction, status, accessToken, refreshToken, async (newAccessToken, newRefreshToken) => {
        await updateSession({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    orders: data?.results || [],
    pagination: data ? {
      count: data.count,
      next: data.next,
      previous: data.previous,
    } : null,
    isLoading,
    isError: error,
    mutate,
  }
}

