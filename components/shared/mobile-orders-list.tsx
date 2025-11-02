"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { fetchOrders } from "@/lib/services/orders"
import { Order, OrderDirection, OrderStatus } from "@/types/orders"
import {
  getStatusLabel,
  getStatusBadgeClasses,
} from "@/lib/utils/orders"
import {
  CheckCircleIcon,
  TruckIcon,
  ClockIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline"

const ORDER_STATUSES: OrderStatus[] = [
  "all",
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "at_agent_office",
  "pending_agent_delivery",
  "out_for_return",
  "delivered",
  "failed",
  "cancelled",
  "returned",
]

function getIcon(status: OrderStatus) {
  if (status === "delivered") return <CheckCircleIcon className="h-6 w-6" />
  if (status === "in_transit" || status === "picked_up" || status === "at_agent_office" || status === "pending_agent_delivery" || status === "out_for_return") {
    return <TruckIcon className="h-6 w-6" />
  }
  if (status === "pending" || status === "assigned") return <ClockIcon className="h-6 w-6" />
  return <TruckIcon className="h-6 w-6" />
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function MobileOrdersList({
  showHeader = true,
  directionFilter = "all",
}: {
  showHeader?: boolean
  directionFilter?: OrderDirection
}) {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus>("all")

  React.useEffect(() => {
    async function loadOrders() {
      if (!session?.accessToken || !session?.refreshToken) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await fetchOrders({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          direction: directionFilter,
          status: statusFilter,
          onTokenUpdate: async (newAccessToken, newRefreshToken) => {
            await updateSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
          },
        })
        setOrders(data)
      } catch (error) {
        console.error("Failed to fetch orders:", error)
        // If token refresh failed, logout the user
        if (error instanceof Error && error.message.includes("Token refresh failed")) {
          await signOut({ redirect: false })
          router.push("/login")
          router.refresh()
          return
        }
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [session?.accessToken, session?.refreshToken, directionFilter, statusFilter, updateSession, router])

  return (
    <div className="md:hidden w-full">
      {/* Optional internal header (hide when page provides its own) */}
      {showHeader && (
        <div className="px-4 pt-2 pb-3">
          <h3 className="text-base font-semibold">Shipping Record</h3>
        </div>
      )}

      {/* Status Filter Pills */}
      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                statusFilter === status
                  ? "bg-foreground text-background"
                  : "bg-background border border-border text-foreground"
              )}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 pb-6 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TruckIcon className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No orders found</EmptyTitle>
              <EmptyDescription>
                {directionFilter !== "all" || statusFilter !== "all"
                  ? "No orders match the current filters. Try adjusting your filters."
                  : "You don't have any orders yet."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          orders.map((order, idx) => {
            const isHighlighted = idx === 0 && order.status === "in_transit"
            return (
              <Card
                key={order.id}
                className={cn(
                  "border rounded-2xl p-0 overflow-hidden cursor-pointer transition-opacity hover:opacity-90",
                  isHighlighted
                    ? "bg-white text-black dark:bg-zinc-900"
                    : "bg-background"
                )}
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                {/* Top section */}
                <div className={cn("p-4 pb-3 flex items-start gap-3")}>
                  <div
                    className={cn(
                      "shrink-0 w-11 h-11 rounded-full flex items-center justify-center",
                      isHighlighted
                        ? "bg-white/30 text-black"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {getIcon(order.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cn("text-xs opacity-80")}>Order Number</p>
                        <p className="font-semibold truncate">{order.order_number}</p>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs",
                          getStatusBadgeClasses(order.status)
                        )}
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p className={cn("opacity-70")}>Sender</p>
                        <p className="font-medium truncate">{order.sender_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className={cn("opacity-70")}>Date</p>
                        <p className="font-medium truncate">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div
                  className={cn(
                    "flex items-center divide-x",
                    isHighlighted ? "border-t border-black/10" : "border-t border-border"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant={isHighlighted ? "ghost" : "ghost"}
                    className={cn(
                      "flex-1 rounded-none py-3",
                      isHighlighted ? "text-amber-400" : "text-amber-600"
                    )}
                    asChild
                  >
                    <Link href={`/orders/${order.id}/tracking`}>
                      <span className="mr-1">Track</span>
                    </Link>
                  </Button>
                  <Button
                    variant={isHighlighted ? "ghost" : "ghost"}
                    className={cn(
                      "flex-1 rounded-none py-3 justify-between",
                      isHighlighted ? "text-black" : "text-foreground"
                    )}
                    asChild
                  >
                    <Link href={`/orders/${order.id}`}>
                      <span>View Details</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default MobileOrdersList
