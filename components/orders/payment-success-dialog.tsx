"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "@heroicons/react/24/solid"
import { XMarkIcon } from "@heroicons/react/24/outline"

interface PaymentSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentSuccessDialog({
  open,
  onOpenChange,
}: PaymentSuccessDialogProps) {
  const router = useRouter()

  // Trigger confetti when dialog opens
  React.useEffect(() => {
    if (open) {
      // Create a confetti burst from multiple angles
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        if (Date.now() > end) return

        // Launch confetti from left
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.5 },
          colors: ["#FFD700", "#FF69B4", "#00CED1", "#FFA500"],
        })

        // Launch confetti from right
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.5 },
          colors: ["#FFD700", "#FF69B4", "#00CED1", "#FFA500"],
        })

        // Launch confetti from center top
        confetti({
          particleCount: 2,
          angle: 90,
          spread: 45,
          origin: { x: 0.5, y: 0 },
          colors: ["#FFD700", "#FF69B4", "#00CED1", "#FFA500"],
        })

        requestAnimationFrame(frame)
      }

      frame()

      // Also do a big burst
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.5, y: 0.3 },
          colors: ["#FFD700", "#FF69B4", "#00CED1", "#FFA500"],
        })
      }, 100)
    }
  }, [open])

  const handleGoHome = () => {
    onOpenChange(false)
    router.push("/dashboard")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm rounded-3xl p-8 bg-white dark:bg-zinc-900 border-0 shadow-2xl"
        showCloseButton={false}
      >
        {/* Close Button - Top Right */}
        <DialogClose asChild>
          <button
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#7CB342] hover:bg-[#6A9F38] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-4 w-4 text-white" />
          </button>
        </DialogClose>

        {/* Content */}
        <div className="flex flex-col items-center justify-center space-y-6 pt-8 pb-4">
          {/* Large Green Circle with Checkmark */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-[#7CB342] flex items-center justify-center shadow-lg">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                <CheckIcon className="w-10 h-10 text-[#7CB342]" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Payment successful
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Order is now ready for delivery processing
            </p>
          </div>

          {/* Home Button */}
          <Button
            onClick={handleGoHome}
            className="w-full h-12 rounded-xl border-2 border-[#F08080] bg-white hover:bg-gray-50 text-[#7CB342] font-medium text-base"
            variant="outline"
          >
            Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

