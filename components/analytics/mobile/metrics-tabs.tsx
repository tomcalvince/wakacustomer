"use client"

import * as React from "react"
import { ArrowUpIcon, ArrowDownIcon, InformationCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import metricsData from "@/data.json"

interface MetricCardProps {
  title: string
  value: string
  change: number
  changeType: "increase" | "decrease"
  graphic: React.ReactNode
  description?: string
}

function MetricCard({ title, value, change, changeType, graphic, description }: MetricCardProps) {
  const isPositive = changeType === "increase"
  
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4 border rounded-xl">
        <div className="space-y-4">
          {/* Title with Info Icon */}
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {description && (
              <div className="group relative">
                <InformationCircleIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 shadow-md whitespace-nowrap border">
                    {description}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Value and Comparison */}
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">vs last month</span>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                    isPositive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {isPositive ? (
                    <ArrowUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3" />
                  )}
                  <span>{Math.abs(change)}%</span>
                </div>
              </div>
            </div>

            {/* Graphic */}
            <div className="flex-shrink-0">{graphic}</div>
          </div>

          {/* Separator */}
          <div className="border-t pt-4">
            {/* See Details Link */}
            <button className="flex items-center gap-1 text-sm font-medium hover:underline">
              See Details
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Graphic Components
function BarChartGraphic() {
  return (
    <div className="flex items-end gap-1 h-12">
      <div className="w-3 bg-orange-400 rounded-t-sm" style={{ height: '60%' }}>
        <div className="h-2 bg-orange-300 rounded-t-sm" />
      </div>
      <div className="w-3 bg-orange-400 rounded-t-sm" style={{ height: '80%' }}>
        <div className="h-2 bg-orange-300 rounded-t-sm" />
      </div>
      <div className="w-3 bg-orange-400 rounded-t-sm" style={{ height: '50%' }}>
        <div className="h-2 bg-orange-300 rounded-t-sm" />
      </div>
    </div>
  )
}

function LineChartGraphic() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 32C8 28 12 24 16 28C20 32 24 20 28 16C32 12 36 16 40 12C42 10 44 8 46 10"
        stroke="#fb923c"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M4 36C8 32 12 28 16 32C20 36 24 24 28 20C32 16 36 20 40 16C42 14 44 12 46 14"
        stroke="#fdba74"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function DonutChartGraphic() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="24"
        cy="24"
        r="16"
        stroke="#fb923c"
        strokeWidth="8"
        strokeDasharray="75 25"
        strokeLinecap="round"
        fill="none"
        transform="rotate(-90 24 24)"
      />
      <circle
        cx="24"
        cy="24"
        r="16"
        stroke="#fdba74"
        strokeWidth="8"
        strokeDasharray="25 75"
        strokeDashoffset="-75"
        strokeLinecap="round"
        fill="none"
        transform="rotate(-90 24 24)"
      />
    </svg>
  )
}

function EqualizerGraphic() {
  return (
    <div className="flex items-end gap-0.5 h-12">
      {[70, 50, 80, 40, 90, 60, 75, 55].map((height, i) => (
        <div key={i} className="w-1 bg-orange-400 rounded-t-sm" style={{ height: `${height}%` }}>
          <div className="h-1 bg-orange-300 rounded-t-sm" />
        </div>
      ))}
    </div>
  )
}

export function MobileMetricsTabs() {
  // Map graphic types to components
  const getGraphic = (type: string) => {
    switch (type) {
      case "bar":
        return <BarChartGraphic />
      case "line":
        return <LineChartGraphic />
      case "donut":
        return <DonutChartGraphic />
      case "equalizer":
        return <EqualizerGraphic />
      default:
        return <BarChartGraphic />
    }
  }

  const metrics = metricsData.metrics.map((metric, index) => ({
    id: `metric-${index}`,
    title: metric.title,
    value: metric.value,
    change: metric.change,
    changeType: metric.changeType as "increase" | "decrease",
    graphic: getGraphic(metric.graphicType),
    description: metric.description,
  }))

  // Create short labels for tabs
  const getTabLabel = (title: string) => {
    const labels: Record<string, string> = {
      "Active Orders": "Active",
      "Parcels Sent": "Sent",
      "Parcels Collected": "Collected",
      "Pending Collections": "Pending"
    }
    return labels[title] || title
  }

  return (
    <Tabs defaultValue={metrics[0].id} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        {metrics.map((metric) => (
          <TabsTrigger key={metric.id} value={metric.id} className="text-xs">
            {getTabLabel(metric.title)}
          </TabsTrigger>
        ))}
      </TabsList>
      {metrics.map((metric) => (
        <TabsContent key={metric.id} value={metric.id}>
          <MetricCard {...metric} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

