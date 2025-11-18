"use client"

import React from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import MobilePageHeader from "@/components/shared/mobile-page-header"
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
import { fetchOrderDetails } from "@/lib/services/orders"
import { MarkPaidDrawer } from "@/components/orders/mark-paid-drawer"
import { OrderDetails } from "@/types/orders"
import {
  getStatusLabel,
  getStatusColor,
  getStatusVariant,
  getStatusBadgeClasses,
} from "@/lib/utils/orders"
import {
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
  ClockIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline"

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Not set"
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function formatCurrency(amount: string) {
  try {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
    }).format(parseFloat(amount))
  } catch {
    return `UGX ${amount}`
  }
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>()
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [order, setOrder] = React.useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = React.useState(false)

  React.useEffect(() => {
    async function loadOrderDetails() {
      const id = params?.id as string
      if (!id || !session?.accessToken || !session?.refreshToken) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchOrderDetails({
          orderId: id,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          onTokenUpdate: async (newAccessToken, newRefreshToken) => {
            await updateSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
          },
        })

        if (data) {
          setOrder(data)
        } else {
          setError("Order not found")
        }
      } catch (err) {
        console.error("Failed to fetch order details:", err)
        // If token refresh failed, logout the user
        if (err instanceof Error && err.message.includes("Token refresh failed")) {
          await signOut({ redirect: false })
          router.push("/login")
          router.refresh()
          return
        }
        setError("Failed to load order details. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadOrderDetails()
  }, [params?.id, session?.accessToken, session?.refreshToken, updateSession, router])

  // Reload order details after payment
  const handlePaymentSuccess = React.useCallback(async () => {
    const id = params?.id as string
    if (!id || !session?.accessToken || !session?.refreshToken) {
      return
    }

    try {
      const data = await fetchOrderDetails({
        orderId: id,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        onTokenUpdate: async (newAccessToken, newRefreshToken) => {
          await updateSession({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        },
      })

      if (data) {
        setOrder(data)
      }
    } catch (err) {
      console.error("Failed to refresh order details:", err)
    }
  }, [params?.id, session?.accessToken, session?.refreshToken, updateSession])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col md:gap-6 gap-0 md:p-6 p-0 h-full">
        <MobilePageHeader title="Order Details" />
        <div className="flex items-center justify-center flex-1 px-4">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-1 flex-col md:gap-6 gap-0 md:p-6 p-0 h-full">
        <MobilePageHeader title="Order Details" />
        <div className="flex items-center justify-center flex-1 px-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TruckIcon className="size-6" />
              </EmptyMedia>
              <EmptyTitle>Order not found</EmptyTitle>
              <EmptyDescription>
                {error || "Unable to load order details. Please try again."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col md:gap-6 gap-0 md:p-6 p-0 h-full">
      {/* Mobile header */}
      <MobilePageHeader title="Order Details" />

      {/* Content */}
      <div className="px-4 py-4 md:hidden space-y-4 overflow-y-auto">
        {/* Order Summary Card */}
        <Card className="rounded-2xl p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Order Number</p>
              <p className="font-semibold text-base">{order.order_number}</p>
              {order.tracking_number && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tracking: {order.tracking_number}
                </p>
              )}
            </div>
            <Badge
              variant={getStatusVariant(order.status)}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                getStatusBadgeClasses(order.status)
              )}
            >
              {order.status_display || getStatusLabel(order.status)}
            </Badge>
          </div>

          <hr className="my-4" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Service Type</p>
              <p className="font-medium">{order.service_type_display}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Service Option</p>
              <p className="font-medium">{order.service_option_display}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Delivery Time</p>
              <p className="font-medium">{order.delivery_time_display}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Status</p>
              <p className="font-medium">{order.payment_status_display}</p>
            </div>
          </div>
        </Card>

        {/* Sender Information */}
        <Card className="rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Sender Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{order.sender_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">{order.sender_phone}</p>
            </div>
          </div>
        </Card>

        {/* Pickup Location */}
        <Card className="rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Pickup Location</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{order.pickup_address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.origin_office_name} ({order.origin_office_code})
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Delivery Location */}
        <Card className="rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Delivery Location</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{order.delivery_address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.destination_office_name} ({order.destination_office_code})
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recipient Information */}
        <Card className="rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Recipient Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{order.recipient.recipient_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">{order.recipient.recipient_phone}</p>
            </div>
            {order.recipient.delivery_instructions && (
              <div>
                <p className="text-xs text-muted-foreground">Delivery Instructions</p>
                <p className="text-sm">{order.recipient.delivery_instructions}</p>
              </div>
            )}
            {order.requires_signature && (
              <Badge variant="outline" className="w-fit">
                Requires Signature
              </Badge>
            )}
            {order.requires_id_verification && (
              <Badge variant="outline" className="w-fit">
                Requires ID Verification
              </Badge>
            )}
          </div>
        </Card>

        {/* Parcels */}
        {order.parcels && order.parcels.length > 0 && (
          <Card className="rounded-2xl p-4">
            <h3 className="font-semibold mb-4">Parcels ({order.parcels.length})</h3>
            <div className="space-y-4">
              {order.parcels.map((parcel) => (
                <div key={parcel.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium">{parcel.parcel_name}</p>
                    {parcel.cod && (
                      <Badge variant="outline" className="text-xs">
                        COD: {formatCurrency(parcel.cod_amount)}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-medium">{parcel.weight} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Size</p>
                      <p className="font-medium">{parcel.size_display}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Package Type</p>
                      <p className="font-medium">{parcel.package_type_display}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Declared Value</p>
                      <p className="font-medium">{formatCurrency(parcel.declared_value)}</p>
                    </div>
                  </div>
                  {parcel.special_instructions && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">Special Instructions</p>
                      <p className="text-sm">{parcel.special_instructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Fee Breakdown */}
        <Card className="rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Fee Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Fee</span>
              <span className="font-medium">{formatCurrency(order.base_fee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Distance Fee</span>
              <span className="font-medium">{formatCurrency(order.distance_fee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Weight Fee</span>
              <span className="font-medium">{formatCurrency(order.weight_fee)}</span>
            </div>
            {parseFloat(order.service_fee) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-medium">{formatCurrency(order.service_fee)}</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total_fee)}</span>
            </div>
          </div>
        </Card>

        {/* Order Timeline */}
        <Card className="rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Order Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ClockIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Created</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
              </div>
            </div>
            {order.scheduled_delivery && (
              <div className="flex items-start gap-3">
                <ClockIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Scheduled Delivery</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.scheduled_delivery)}
                  </p>
                </div>
              </div>
            )}
            {order.picked_up_at && (
              <div className="flex items-start gap-3">
                <TruckIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Picked Up</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.picked_up_at)}
                  </p>
                </div>
              </div>
            )}
            {order.delivered_at && (
              <div className="flex items-start gap-3">
                <TruckIcon className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Delivered</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.delivered_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Special Instructions */}
        {order.special_instructions && (
          <Card className="rounded-2xl p-4">
            <h3 className="font-semibold mb-2">Special Instructions</h3>
            <p className="text-sm text-muted-foreground">{order.special_instructions}</p>
          </Card>
        )}

        {/* Actions */}
        <Card className="rounded-2xl p-4">
          <div className="space-y-3">
            <Button className="w-full h-12 text-base" asChild>
              <a href={`/orders/${order.id}/tracking`}>Live Tracking</a>
            </Button>
            {/* Pay Button - Only show if payment is not paid */}
            {order.payment_status !== "paid" && order.payment_status_display?.toLowerCase() !== "paid" && (
              <Button
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                onClick={() => setIsPaymentDrawerOpen(true)}
              >
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Pay
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Drawer */}
      {order && (
        <MarkPaidDrawer
          open={isPaymentDrawerOpen}
          onOpenChange={setIsPaymentDrawerOpen}
          orderId={order.id}
          orderNumber={order.order_number}
          totalFee={order.total_fee}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
