"use client"

import * as React from "react"
import {
  ShoppingBagIcon,
  WalletIcon,
  Squares2X2Icon,
  HomeModernIcon,
  BellIcon,
  UserCircleIcon,
  MapPinIcon,
  CalculatorIcon,
} from "@heroicons/react/24/outline"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "PICKUPWAKA",
      logo: Squares2X2Icon,
      plan: "Agent",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: HomeModernIcon,
      isActive: true,
    },
    {
      title: "Orders",
      url: "/orders",
      icon: ShoppingBagIcon,
      
    },
    {
      title: "Wallet",
      url: "/wallet",
      icon: WalletIcon,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: BellIcon,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: UserCircleIcon,
    },
    {
      title: "Track",
      url: "/track",
      icon: MapPinIcon,
    },
    {
      title: "Check Rates",
      url: "/rates",
      icon: CalculatorIcon,
    },
  ],
  
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
