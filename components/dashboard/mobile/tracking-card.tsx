"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon, MapIcon } from "@heroicons/react/24/outline"
import { ArchiveBoxIcon } from "@heroicons/react/24/solid"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ReceiptCentIcon } from "lucide-react"
import { toast } from "sonner"
import { CreateOrderDrawer } from "@/components/orders/create-order-drawer"
import Link from "next/link"

export function TrackingCard() {
  const router = useRouter()
  const [isCreateOrderOpen, setIsCreateOrderOpen] = React.useState(false)
  const [trackingNumber, setTrackingNumber] = React.useState("")

  const handleTrack = () => {
    const trimmedNumber = trackingNumber.trim()
    
    if (!trimmedNumber) {
      toast.error("Please enter a tracking number")
      return
    }

    // Navigate directly to tracking page with tracking number
    router.push(`/track?number=${encodeURIComponent(trimmedNumber)}`)
    setTrackingNumber("") // Clear input
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTrack()
    }
  }

  return (
    <div className="relative w-full">
      {/* Blurred Map Background */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <div className="w-full h-full bg-linear-to-br from-purple-100 via-blue-50 to-purple-100" />
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Purple Tracking Card */}
        <div className="bg-linear-to-b from-orange-500 via-orange-600 to-orange-700 rounded-3xl p-6 shadow-lg">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-white">Track package</h2>
              <p className="text-purple-100 text-sm mt-1">Please enter tracking number</p>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center gap-2 bg-white rounded-xl p-2">
              <div className="flex">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-4 h-12 bg-white border-0 rounded-xl text-base"
                  />
                </div>
                <div className="ml-2">
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-xl"
                    onClick={handleTrack}
                    disabled={!trackingNumber.trim()}
                  >
                    <MapIcon className="h-6 w-6 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {/* Check Rates */}
          <Link href="/rates" className="w-full">
            <Button variant={"outline"} className="flex items-center gap-2 p-8 w-full">
              <ReceiptCentIcon className="h-6 w-6" />
              <span className="font-medium ">Check Rates</span>
            </Button>
          </Link>

          {/* New Order */}
          <Button
            className="flex items-center gap-2 p-8 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setIsCreateOrderOpen(true)}
          >
            <ArchiveBoxIcon className="h-6 w-6" />
            <span className="font-medium">New Order</span>
          </Button>

        </div>
      </div>

      <CreateOrderDrawer
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
      />
    </div>
  )
}

