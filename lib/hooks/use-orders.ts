import useSWR from "swr"
import { useSession } from "next-auth/react"
import { fetchOrders } from "@/lib/services/orders"
import type { Order, OrderDirection, OrderStatus } from "@/types/orders"

/**
 * SWR fetcher function for orders
 */
async function ordersFetcher(
  url: string,
  direction: OrderDirection,
  status: OrderStatus,
  accessToken: string,
  refreshToken: string,
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
): Promise<Order[]> {
  return fetchOrders({
    direction,
    status,
    accessToken,
    refreshToken,
    onTokenUpdate,
  })
}

/**
 * Hook to fetch orders using SWR
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
    orders: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

