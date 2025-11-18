"use client"

import * as React from "react"
import { ArrowPathIcon } from "@heroicons/react/24/outline"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/currency"
import type { PricingResponse } from "@/lib/services/pricing"

interface RatesDisplayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pickupAddress: string
  deliveryAddress: string
  standardRate: PricingResponse | null
  expressRate: PricingResponse | null
  onSwapLocations?: () => void
}

export function RatesDisplay({
  open,
  onOpenChange,
  pickupAddress,
  deliveryAddress,
  standardRate,
  expressRate,
  onSwapLocations,
}: RatesDisplayProps) {
  // Calculate estimated delivery times (in days)
  const getDeliveryTime = (serviceLevel: string, distanceKm: number): string => {
    if (serviceLevel === "express") {
      return "1-2 days"
    }
    // Standard service
    if (distanceKm < 50) {
      return "1-2 days"
    } else if (distanceKm < 200) {
      return "2-3 days"
    } else {
      return "3-4 days"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">Rates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Location Summary */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Pick up Location</p>
              <p className="text-sm font-semibold break-words">{pickupAddress}</p>
            </div>
            {onSwapLocations && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSwapLocations}
                className="shrink-0 h-8 w-8 rounded-full bg-teal-50 hover:bg-teal-100 mt-5"
                title="Swap locations"
              >
                <ArrowPathIcon className="h-4 w-4 text-teal-600" />
              </Button>
            )}
            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs text-muted-foreground">Package Destination</p>
              <p className="text-sm font-semibold break-words">{deliveryAddress}</p>
            </div>
          </div>

          {/* Service Options */}
          <div className="space-y-3">
            {/* Regular (Standard) Service */}
            {standardRate && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-teal-50/50 border border-teal-100">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <svg
                      className="h-6 w-6 text-teal-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Regular</p>
                    <p className="text-xs text-muted-foreground">
                      {getDeliveryTime("standard", standardRate.distance_km)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-teal-600">
                    {formatCurrency(standardRate.total_fee)}
                  </p>
                </div>
              </div>
            )}

            {/* Express Service */}
            {expressRate && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-teal-50/50 border border-teal-100">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <svg
                      className="h-6 w-6 text-teal-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Express</p>
                    <p className="text-xs text-muted-foreground">
                      {getDeliveryTime("express", expressRate.distance_km)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-teal-600">
                    {formatCurrency(expressRate.total_fee)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium mt-4"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

