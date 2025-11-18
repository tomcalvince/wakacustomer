"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { CheckCircleIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useOrders } from "@/lib/hooks/use-orders"
import { OrderDirection, OrderStatus } from "@/types/orders"
import { fetchOrdersPage } from "@/lib/services/orders"
import {
  getStatusLabel,
  getStatusColor,
  getIconColor,
  getStatusVariant,
} from "@/lib/utils/orders"

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

export function RecentOrdersTable() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [directionFilter, setDirectionFilter] = React.useState<OrderDirection>("all")
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus>("all")
  const { orders: initialOrders, pagination, isLoading, isError, mutate } = useOrders(directionFilter, statusFilter)
  
  // State for infinite scroll
  const [allOrders, setAllOrders] = React.useState<typeof initialOrders>([])
  const [nextUrl, setNextUrl] = React.useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const loadMoreRefDesktop = React.useRef<HTMLDivElement>(null)
  const loadMoreRefMobile = React.useRef<HTMLDivElement>(null)

  // Track previous filter values and initial orders to detect changes
  const prevFiltersRef = React.useRef<{ direction: OrderDirection; status: OrderStatus }>({
    direction: directionFilter,
    status: statusFilter,
  })
  const prevInitialOrdersRef = React.useRef<typeof initialOrders>([])
  const hasOrdersRef = React.useRef(false)

  // Reset and update orders when filters or initial data changes
  React.useEffect(() => {
    const filtersChanged =
      prevFiltersRef.current.direction !== directionFilter ||
      prevFiltersRef.current.status !== statusFilter

    // Check if initial orders actually changed (by comparing first order ID)
    const ordersChanged =
      initialOrders.length !== prevInitialOrdersRef.current.length ||
      (initialOrders.length > 0 &&
        prevInitialOrdersRef.current.length > 0 &&
        initialOrders[0]?.id !== prevInitialOrdersRef.current[0]?.id)

    if (filtersChanged) {
      // Reset when filters change
      setAllOrders([])
      setNextUrl(null)
      setHasMore(false)
      setIsLoadingMore(false)
      prevFiltersRef.current = { direction: directionFilter, status: statusFilter }
      prevInitialOrdersRef.current = []
      hasOrdersRef.current = false
    }

    // Update orders when initial data is available and changed (after reset or initial load)
    if (initialOrders.length > 0 && (filtersChanged || ordersChanged)) {
      setAllOrders(initialOrders)
      setNextUrl(pagination?.next || null)
      setHasMore(!!pagination?.next)
      prevInitialOrdersRef.current = initialOrders
      hasOrdersRef.current = true
    } else if (initialOrders.length === 0 && !isLoading && hasOrdersRef.current) {
      // Clear orders if no results and not loading
      setAllOrders([])
      setNextUrl(null)
      setHasMore(false)
      prevInitialOrdersRef.current = []
      hasOrdersRef.current = false
    }
  }, [initialOrders, pagination?.next, isLoading, directionFilter, statusFilter])

  // Load more orders when scrolling to bottom
  const loadMore = React.useCallback(async () => {
    if (!nextUrl || isLoadingMore || !session?.accessToken || !session?.refreshToken) {
      return
    }

    setIsLoadingMore(true)
    try {
      const response = await fetchOrdersPage({
        nextUrl,
        direction: directionFilter,
        status: statusFilter,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        onTokenUpdate: async (newAccessToken, newRefreshToken) => {
          await updateSession({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        },
      })

      if (response.results.length > 0) {
        setAllOrders((prev) => [...prev, ...response.results])
        setNextUrl(response.next)
        setHasMore(!!response.next)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to load more orders:", error)
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [nextUrl, isLoadingMore, session, directionFilter, statusFilter, updateSession])

  // Intersection Observer for infinite scroll - desktop
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: "100px", // Start loading 100px before reaching bottom
        threshold: 0.1,
      }
    )

    const currentRef = loadMoreRefDesktop.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, isLoadingMore, loadMore])

  // Intersection Observer for infinite scroll - mobile
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      {
        root: null,
        rootMargin: "100px", // Start loading 100px before reaching bottom
        threshold: 0.1,
      }
    )

    const currentRef = loadMoreRefMobile.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, isLoadingMore, loadMore])

  // Handle errors (token refresh failures)
  React.useEffect(() => {
    if (isError) {
      if (isError instanceof Error && isError.message.includes("Token refresh failed")) {
        signOut({ redirect: false }).then(() => {
          router.push("/login")
          router.refresh()
        })
      }
    }
  }, [isError, router])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Card className="border-0 shadow-none p-0 h-full flex flex-col">
      <CardHeader className="hidden md:block">
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>
          Latest orders and their current status
        </CardDescription>
        {/* Desktop Filters */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Direction:</label>
            <Select
              value={directionFilter}
              onValueChange={(value) => setDirectionFilter(value as OrderDirection)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
                <SelectItem value="outgoing">Outgoing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Status:</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderStatus)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="md:p-6 p-0 flex-1 flex flex-col min-h-0">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : allOrders.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CheckCircleIcon className="size-6" />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.sender_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(order.status)}
                        className={cn("font-normal", getStatusColor(order.status))}
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/orders/${order.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Loading indicator and intersection observer target */}
                {hasMore && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <div ref={loadMoreRefDesktop} className="h-4" />
                      {isLoadingMore && (
                        <p className="text-muted-foreground text-sm">Loading more orders...</p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Mobile Activity View */}
        <div className="md:hidden flex flex-col flex-1 min-h-0">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between mb-4 p-3 pb-0 shrink-0">
            <h3 className="text-md font-semibold">Recent orders</h3>
            <Button variant={"outline"} className="text-sm text-primary font-medium " asChild>
              <Link href="/orders">See all</Link>
            </Button>
          </div>

          {/* Activity List - Scrollable */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground text-sm">Loading orders...</p>
              </div>
            ) : allOrders.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CheckCircleIcon className="size-6" />
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
              <div className="space-y-3">
                {allOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-3 py-3 cursor-pointer transition-opacity hover:opacity-80"
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                        getIconColor(order.status)
                      )}
                    >
                      <CheckCircleIcon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{order.sender_name}</p>
                      <p className="text-xs text-muted-foreground">ID: {order.order_number}</p>
                    </div>

                    {/* Status Badge */}
                    <Badge
                      className={cn(
                        "font-normal text-xs px-3 py-1 rounded-full",
                        getStatusColor(order.status)
                      )}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                  </Link>
                ))}
                {/* Loading indicator and intersection observer target */}
                {hasMore && (
                  <div ref={loadMoreRefMobile} className="py-4 text-center">
                    {isLoadingMore && (
                      <p className="text-muted-foreground text-sm">Loading more orders...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
