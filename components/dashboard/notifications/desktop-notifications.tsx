"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FunnelIcon, EllipsisVerticalIcon, CheckCircleIcon } from "@heroicons/react/24/outline"

export type NotificationItem = {
  id: string
  title: string
  category: "Order" | "Commission" | "Debt" | "Customer" | "Payment" | "Urgent" | "System"
  subtitle: string
  tag: string
  date: string
  unread?: boolean
  amount?: string
  customerName?: string
}

export const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  { id: "1", title: "New Order Received", category: "Order", subtitle: "Customer John Smith has placed a new order for delivery to downtown office.", tag: "Order #ORD-2024-001", date: "10:23 AM", unread: true, customerName: "John Smith" },
  { id: "2", title: "Commission Payment Processed", category: "Commission", subtitle: "Your commission for order #ORD-2024-001 has been processed and deposited.", tag: "Commission", date: "Yesterday", amount: "UGX 175,000" },
  { id: "3", title: "Debt Payment Reminder", category: "Debt", subtitle: "Outstanding debt payment of UGX 150,000 is due by end of month.", tag: "Outstanding Debt", date: "May 6", amount: "UGX 150,000" },
  { id: "4", title: "Order Delivery Failed", category: "Urgent", subtitle: "Delivery attempt failed for order #ORD-2024-002. Customer not available.", tag: "Order #ORD-2024-002", date: "May 5", customerName: "Sarah Johnson" },
  { id: "5", title: "Customer Inquiry", category: "Customer", subtitle: "Customer Mike Davis is asking about order status and delivery timeline.", tag: "Customer Support", date: "May 4", customerName: "Mike Davis" },
  { id: "6", title: "Order Created Successfully", category: "Order", subtitle: "You have successfully created order #ORD-2024-003 on behalf of customer.", tag: "Order #ORD-2024-003", date: "May 2", customerName: "Lisa Chen" },
  { id: "7", title: "Payment Received", category: "Payment", subtitle: "Customer payment of UGX 350,000 has been processed for order #ORD-2024-004.", tag: "Payment Confirmation", date: "May 1", amount: "UGX 350,000" },
  { id: "8", title: "System Maintenance Notice", category: "System", subtitle: "Scheduled system maintenance will occur tonight from 2-4 AM.", tag: "System Update", date: "May 1" },
]

export const categoryColor = (category: NotificationItem["category"]) => {
  switch (category) {
    case "Order":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "Commission":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "Debt":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "Customer":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    case "Payment":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "Urgent":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    case "System":
      return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300"
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300"
  }
}

export function DesktopNotifications() {
  const [query, setQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState<string>(SAMPLE_NOTIFICATIONS[0]?.id ?? "")
  const selected = React.useMemo(() => SAMPLE_NOTIFICATIONS.find(n => n.id === selectedId)!, [selectedId])

  const filtered = React.useMemo(() => {
    if (!query) return SAMPLE_NOTIFICATIONS
    return SAMPLE_NOTIFICATIONS.filter(n =>
      `${n.title} ${n.subtitle} ${n.tag}`.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  return (
    <div className="hidden md:grid grid-cols-12 gap-4 w-full">
      {/* Left column - list */}
      <Card className="col-span-5 p-0 overflow-hidden">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Notifications</CardTitle>
              <CardDescription>View, filter and manage updates</CardDescription>
            </div>
            <Button variant="ghost" size="icon" aria-label="filters">
              <FunnelIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="mt-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notifications"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50",
                  selectedId === n.id && "bg-muted/70"
                )}
              >
                <div className={cn("mt-1 h-2 w-2 rounded-full", n.unread ? "bg-primary" : "bg-transparent")} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full", categoryColor(n.category))}>{n.category}</span>
                    <span className="text-xs text-muted-foreground">{n.date}</span>
                  </div>
                  <div className="mt-1 font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{n.subtitle}</div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="font-normal">{n.tag}</Badge>
                  </div>
                </div>
                <EllipsisVerticalIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Right column - details */}
      <Card className="col-span-7 p-0 overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg">{selected.title}</CardTitle>
          <CardDescription>
            {selected.date} • {selected.tag}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-6">
          {/* Status Banner */}
          <div className="rounded-md border bg-muted/30 p-4 text-sm">
            <div className="font-medium mb-1">
              {selected.category === "Order" ? "Order Status Update" : 
               selected.category === "Commission" ? "Commission Payment" :
               selected.category === "Debt" ? "Debt Reminder" :
               selected.category === "Customer" ? "Customer Inquiry" :
               selected.category === "Payment" ? "Payment Confirmation" :
               selected.category === "Urgent" ? "Urgent Action Required" :
               "System Notification"}
            </div>
            <div>{selected.subtitle}</div>
            {selected.amount && (
              <div className="mt-2 font-semibold text-lg">{selected.amount}</div>
            )}
          </div>

          {/* Order Details */}
          {selected.category === "Order" && (
            <div>
              <div className="font-semibold mb-2">Order Details</div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Order ID: {selected.tag}</li>
                <li>Customer: {selected.customerName}</li>
                <li>Delivery Address: Downtown Office Building</li>
                <li>Estimated Delivery: Within 2 business days</li>
                <li>Payment Status: Confirmed</li>
              </ul>
            </div>
          )}

          {/* Commission Details */}
          {selected.category === "Commission" && (
            <div>
              <div className="font-semibold mb-2">Commission Details</div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Order: {selected.tag}</li>
                <li>Commission Rate: 5%</li>
                <li>Order Value: UGX 3,500,000</li>
                <li>Commission Amount: {selected.amount}</li>
                <li>Payment Method: Mobile Money</li>
              </ul>
            </div>
          )}

          {/* Debt Details */}
          {selected.category === "Debt" && (
            <div>
              <div className="font-semibold mb-2">Debt Information</div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Outstanding Amount: {selected.amount}</li>
                <li>Due Date: End of Month</li>
                <li>Payment Method: Mobile Money / Bank Transfer</li>
                <li>Account: ****1234</li>
                <li>Late Fee: UGX 15,000 (if overdue)</li>
              </ul>
            </div>
          )}

          {/* Customer Inquiry Details */}
          {selected.category === "Customer" && (
            <div>
              <div className="font-semibold mb-2">Customer Inquiry</div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Customer: {selected.customerName}</li>
                <li>Inquiry Type: Order Status</li>
                <li>Priority: Normal</li>
                <li>Response Time: Within 4 hours</li>
                <li>Previous Orders: 3 completed</li>
              </ul>
            </div>
          )}

          {/* Next Steps */}
          <div>
            <div className="font-semibold mb-2">Next Steps</div>
            <div className="space-y-2">
              {selected.category === "Order" && [
                "Process order for fulfillment",
                "Schedule delivery pickup",
                "Send confirmation to customer"
              ].map((step, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-[11px]">{idx+1}</span>
                    </div>
                    <span>{step}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{idx === 0 ? "Due Today" : idx === 1 ? "Due Tomorrow" : "Due in 2 days"}</span>
                </div>
              ))}
              
              {selected.category === "Debt" && [
                "Review payment schedule",
                "Process payment",
                "Confirm payment receipt"
              ].map((step, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-[11px]">{idx+1}</span>
                    </div>
                    <span>{step}</span>
                  </div>
                  <span className={cn("text-xs", idx === 0 && "text-red-600")}>{idx === 0 ? "Due Today" : idx === 1 ? "Due Tomorrow" : "Due in 2 days"}</span>
                </div>
              ))}

              {selected.category === "Customer" && [
                "Review customer inquiry",
                "Check order status",
                "Respond to customer"
              ].map((step, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-[11px]">{idx+1}</span>
                    </div>
                    <span>{step}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{idx === 0 ? "Due Today" : idx === 1 ? "Due Today" : "Due in 4 hours"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          {selected.customerName && (
            <div>
              <div className="font-semibold mb-2">Customer Information</div>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{selected.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{selected.customerName}</div>
                  <div className="text-xs text-muted-foreground">Active Customer</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {selected.category === "Order" && (
              <>
                <Button className="gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  Process Order
                </Button>
                <Button variant="outline">View Details</Button>
              </>
            )}
            {selected.category === "Debt" && (
              <>
                <Button className="gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  Make Payment
                </Button>
                <Button variant="outline">View Statement</Button>
              </>
            )}
            {selected.category === "Customer" && (
              <>
                <Button className="gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  Respond
                </Button>
                <Button variant="outline">View History</Button>
              </>
            )}
            {selected.category === "Commission" && (
              <>
                <Button className="gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  View Statement
                </Button>
                <Button variant="outline">Download Receipt</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DesktopNotifications


