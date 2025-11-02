"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import Image from "next/image"
import { ASSETS } from "@/config/assets"

interface WalletActionDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  action: "topup" | "withdraw" | "paydebt"
  balance: number
  currency: string
  onConfirm?: (amount: number, action: "topup" | "withdraw" | "paydebt") => void
}

const formatCurrency = (value: number, code: string) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(value)

export function WalletActionDrawer({ open, onOpenChange, action, balance, currency, onConfirm }: WalletActionDrawerProps) {
  const [amount, setAmount] = React.useState<number>(1000)
  const min = 100
  const max = 50000

  React.useEffect(() => {
    // Reset amount when opening or action changes
    if (open) setAmount(1000)
  }, [open, action])

  const title = action === "topup" ? "Top Up" : action === "withdraw" ? "Withdraw" : "Pay Debt"

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="pb-2 px-4">
          <DrawerTitle className="text-base">{title}</DrawerTitle>
          <DrawerDescription>Use the slider or input to set the amount.</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Balance banner with illustration */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-400 to-green-500 text-white">
            <div className="p-4">
              <p className="text-xs/4 opacity-90">Available Balance</p>
              <p className="text-2xl font-semibold mt-1">{formatCurrency(balance ?? 0, currency)}</p>
            </div>
            <div className="absolute right-2 top-2">
              <Image src={ASSETS.gummyBag} alt="bag" width={72} height={72} />
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
              className="w-full h-12 rounded-xl border bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="100"
            />
          </div>

          {/* Slider */}
          <div className="pt-1">
            <div className="relative">
              <div className="absolute -top-7 left-0 translate-x-[calc((var(--val,0)-100)/(50000-100)*100%)]">
                <span className="bg-black text-white text-xs rounded px-2 py-0.5">{amount}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  ;(e.target as HTMLInputElement).style.setProperty("--val", String(v))
                  setAmount(v)
                }}
                className="w-full h-2 appearance-none rounded-full bg-emerald-500 outline-none accent-black"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{min.toLocaleString()}</span>
                <span>{max.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">Enter amount or use the slider</p>
          </div>
        </div>

        <DrawerFooter className="px-4 pb-4">
          <Button className="h-12 text-base" onClick={() => onConfirm?.(amount, action)}>Continue</Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="h-10">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default WalletActionDrawer


