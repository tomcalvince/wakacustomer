"use client"

import * as React from "react"
import { ChevronLeftIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"

interface MobilePageHeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  showMenu?: boolean
  rightSlot?: React.ReactNode
}

export function MobilePageHeader({
  title,
  showBack = true,
  onBack,
  showMenu = true,
  rightSlot,
}: MobilePageHeaderProps) {
  const router = useRouter()

  return (
    <header className="md:hidden sticky top-0 z-40 bg-background border-b mb-2">
      <div className="flex items-center justify-between px-2 py-3">
        <div className="h-10 w-10 flex items-center justify-center">
          {showBack && (
            <Button variant={"outline"} aria-label="Go back" onClick={() => (onBack ? onBack() : router.back())} className="h-10 w-10 flex items-center justify-center rounded-full">
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
        <h2 className="font-semibold text-xl">{title}</h2>
        <div className="h-10 w-10 flex items-center justify-center">
          {rightSlot ?? (showMenu && (
            <Button variant={"outline"} aria-label="More options" className="h-10 w-10 flex items-center justify-center rounded-full">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </Button>
          ))}
        </div>
      </div>
    </header>
  )
}

export default MobilePageHeader


