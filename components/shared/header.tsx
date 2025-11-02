"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import {
  MagnifyingGlassIcon,
  ShareIcon,
  ClockIcon,
  BellIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import agentData from "@/data.json"

interface HeaderProps {
  userName?: string
}

export function Header({ userName }: HeaderProps) {
  const router = useRouter()
  const agentName = userName || agentData.agentInfo.name
  const agentEmail = agentData.agentInfo.email
  const agentOffice = agentData.agentInfo.office

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      toast.success("Logged out successfully")
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast.error("Failed to log out. Please try again.")
      console.error("Logout error:", error)
    }
  }
  return (
    <header className="hidden md:flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 lg:px-6 sticky top-0 z-40">
      {/* Sidebar Trigger (Mobile) */}
      <SidebarTrigger className="lg:hidden" />

      {/* Left Section - Welcome Message */}
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Welcome,</span>
        <span className="text-sm font-semibold">{agentName}</span>
      </div>

      {/* Center Section - Search Bar */}
      <div className="flex-1 max-w-xl mx-auto hidden md:flex">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-10 pr-20 rounded-lg bg-muted/50 border-0"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-100 sm:flex">
            <span className="text-xs">⌘</span>1
          </kbd>
        </div>
      </div>

      {/* Right Section - Utility Icons and User Profile */}
      <div className="flex items-center gap-2">
        {/* Share Icon */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
          <ShareIcon className="h-4 w-4" />
        </Button>

        {/* Clock Icon */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
          <ClockIcon className="h-4 w-4" />
        </Button>

        {/* Bell Icon with Notification Dot */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
          <BellIcon className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 rounded-lg px-3"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src="/avatars/agent.jpg" alt={agentName} />
                <AvatarFallback className="text-xs">
                  {agentName.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block">
                {agentName.split(" ")[0]}
              </span>
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{agentName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {agentEmail}
                </p>
                <p className="text-xs leading-none text-muted-foreground font-medium pt-1">
                  {agentOffice}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

