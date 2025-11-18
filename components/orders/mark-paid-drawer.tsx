"use client"

import * as React from "react"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { markOrderAsPaid } from "@/lib/services/orders"
import { PaymentSuccessDialog } from "./payment-success-dialog"

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

interface MarkPaidDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderNumber: string
  totalFee: string
  onSuccess: () => void
}

export function MarkPaidDrawer({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  totalFee,
  onSuccess,
}: MarkPaidDrawerProps) {
  const { data: session, update: updateSession } = useSession()
  const [amount, setAmount] = React.useState(totalFee)
  const [notes, setNotes] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false)

  // Reset form when drawer opens/closes or order changes
  React.useEffect(() => {
    if (open) {
      setAmount(totalFee)
      setNotes("")
      setIsSubmitting(false)
      setShowSuccessDialog(false)
    }
  }, [open, totalFee])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!session?.accessToken || !session?.refreshToken) {
      toast.error("Session expired. Please login again.")
      return
    }

    // Validate amount
    if (!amount.trim()) {
      toast.error("Please enter the amount collected")
      return
    }

    const amountNum = parseFloat(amount)
    const totalFeeNum = parseFloat(totalFee)

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    // Warn if amount doesn't match (but still allow submission)
    if (amountNum !== totalFeeNum) {
      toast.warning(
        `Amount entered (${formatCurrency(amount)}) does not match order total (${formatCurrency(totalFee)}). Please verify before proceeding.`,
        { duration: 5000 }
      )
    }

    setIsSubmitting(true)

    try {
      await markOrderAsPaid({
        orderId,
        amount: amount.trim(),
        notes: notes.trim(),
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        onTokenUpdate: async (newAccessToken, newRefreshToken) => {
          await updateSession({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        },
      })

      setIsSubmitting(false)
      onOpenChange(false)
      setShowSuccessDialog(true)
      onSuccess() // Refresh order details
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to mark order as paid."
      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-3xl max-h-[95vh]">
        <DrawerHeader className="px-4 pb-2">
          <div className="flex items-center gap-3">
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
            </DrawerClose>
            <DrawerTitle className="text-lg font-semibold">Mark Order as Paid</DrawerTitle>
          </div>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="px-4 pb-6 overflow-y-auto flex-1 space-y-6">
          {/* Instruction */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
              Please collect the full amount from the sender before marking the order as paid.
            </p>
          </div>

          {/* Order Info */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Order Number</Label>
            <p className="font-semibold text-base">{orderNumber}</p>
          </div>

          {/* Total Fee Display */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Order Total</Label>
            <p className="font-bold text-xl text-primary">{formatCurrency(totalFee)}</p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Collected *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount collected"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 rounded-xl"
              required
              disabled={isSubmitting}
            />
            {amount && parseFloat(amount) !== parseFloat(totalFee) && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Amount entered does not match order total
              </p>
            )}
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] rounded-xl resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Mark as Paid"}
          </Button>
        </form>
      </DrawerContent>

      {/* Payment Success Dialog */}
      <PaymentSuccessDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} />
    </Drawer>
  )
}

