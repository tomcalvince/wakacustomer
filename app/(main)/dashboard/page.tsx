"use client";

import { ChartLineInteractive } from "@/components/dashboard/analytics/chart-line-interactive";
import { TrackingCard } from "@/components/dashboard/mobile/tracking-card";
import { MetricsCards, RecentOrdersTable, MobileHeader } from "@/components/shared";
import React from "react";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col md:gap-6 gap-0 md:p-6 p-0 h-full">
      {/* Dashboard-only Mobile Header */}
      <div className="md:hidden">
        <MobileHeader />
      </div>
      {/* Mobile Tracking Card - Fixed at top */}
      <div className="md:hidden shrink-0">
        <TrackingCard />
      </div>

      {/* Desktop Metrics Cards */}
      <div className="hidden md:block">
        <MetricsCards />
      </div>
      
      {/* Recent Orders Table - Scrollable on mobile */}
      <div className="flex-1 md:flex-none md:min-h-0 min-h-0">
        <RecentOrdersTable />
      </div>
      
      {/* Chart Area */}
      <div className="hidden md:block">
        <ChartLineInteractive />
      </div>
    </div>
  )
}
