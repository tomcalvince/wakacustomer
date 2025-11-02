"use client"

import * as React from "react"
import { BellIcon } from "@heroicons/react/24/outline"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import agentData from "@/data.json"

interface MobileHeaderProps {
  userName?: string
}

export function MobileHeader({ userName }: MobileHeaderProps) {
  const { data: session } = useSession()
  const agentName = session?.user?.username || userName || agentData.agentInfo.name
  const router = useRouter()

  return (
    <header className="flex items-center justify-between px-4 py-4 bg-background border-b md:hidden sticky top-0 z-40">
      {/* Left Section - Avatar and Welcome Message */}
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src="/avatars/agent.jpg" alt={agentName} />
          <AvatarFallback className="bg-green-700 text-slate-100 text-sm">
            {agentName.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Welcome back,</span>
          <span className="text-base font-bold">{agentName}</span>
        </div>
      </div>

      {/* Right Section - Notification Icon */}
      <Button
        variant="outline"
        size="lg"
        className="relative h-12 w-12 rounded-full border-2"
        onClick={() => router.push("/notifications")}
        aria-label="Open notifications"
      >
        <BellIcon className="h-10 w-10" />
        <span className="absolute right-1 top-0.5 h-3 w-3 rounded-full bg-red-500" />
      </Button>
    </header>
  )
}

