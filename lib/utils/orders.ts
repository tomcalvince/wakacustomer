import { OrderStatus } from "@/types/orders"

/**
 * Maps API status values to user-friendly display labels
 */
export function getStatusLabel(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    pending: "Pending",
    assigned: "Assigned",
    picked_up: "Picked Up",
    in_transit: "In Transit",
    at_agent_office: "At Agent Office",
    pending_agent_delivery: "Pending Delivery",
    out_for_return: "Out for Return",
    delivered: "Delivered",
    failed: "Failed",
    cancelled: "Cancelled",
    returned: "Returned",
    all: "All",
  }
  return statusMap[status] || status
}

/**
 * Gets the badge variant for a status
 */
export function getStatusVariant(
  status: OrderStatus
): "default" | "secondary" | "destructive" | "outline" {
  const variantMap: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    assigned: "outline",
    picked_up: "secondary",
    in_transit: "secondary",
    at_agent_office: "secondary",
    pending_agent_delivery: "outline",
    out_for_return: "outline",
    delivered: "default",
    failed: "destructive",
    cancelled: "destructive",
    returned: "destructive",
    all: "default",
  }
  return variantMap[status] || "default"
}

/**
 * Gets the CSS classes for status badge colors
 */
export function getStatusColor(status: OrderStatus): string {
  const colorMap: Record<OrderStatus, string> = {
    pending: "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
    assigned: "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
    picked_up: "text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
    in_transit: "text-slate-100 bg-zinc-600 dark:text-slate-100 dark:bg-white-900/30",
    at_agent_office: "text-indigo-700 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30",
    pending_agent_delivery: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
    out_for_return: "text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30",
    delivered: "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
    failed: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
    cancelled: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
    returned: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
    all: "bg-gray-100 text-gray-600",
  }
  return colorMap[status] || "bg-gray-100 text-gray-600"
}

/**
 * Gets the CSS classes for status icon background colors
 */
export function getIconColor(status: OrderStatus): string {
  const colorMap: Record<OrderStatus, string> = {
    pending: "bg-orange-100 text-orange-600",
    assigned: "bg-blue-100 text-blue-600",
    picked_up: "bg-purple-100 text-purple-600",
    in_transit: "bg-zinc-600 text-slate-100",
    at_agent_office: "bg-indigo-100 text-indigo-600",
    pending_agent_delivery: "bg-amber-100 text-amber-600",
    out_for_return: "bg-yellow-100 text-yellow-600",
    delivered: "bg-green-700 text-slate-100",
    failed: "bg-red-100 text-red-600",
    cancelled: "bg-red-100 text-red-600",
    returned: "bg-red-100 text-red-600",
    all: "bg-gray-100 text-gray-600",
  }
  return colorMap[status] || "bg-gray-100 text-gray-600"
}

/**
 * Gets status badge classes for mobile view
 */
export function getStatusBadgeClasses(status: OrderStatus): string {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "in_transit":
      return "bg-amber-500 text-white dark:bg-amber-500"
    case "pending":
    case "assigned":
    case "pending_agent_delivery":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    case "cancelled":
    case "failed":
    case "returned":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300"
  }
}

