"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HomeModernIcon,
  ArchiveBoxIcon,
  UserIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline"
import {
  HomeModernIcon as HomeModernIconSolid,
} from "@heroicons/react/24/solid"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    name: "Home",
    href: "/dashboard",
    icon: HomeModernIcon,
    activeIcon: HomeModernIconSolid,
  },
  {
    name: "Deliveries",
    href: "/orders",
    icon: ArchiveBoxIcon,
    activeIcon: ArchiveBoxIcon,
  },
  {
    name: "Wallet",
    href: "/wallet",
    icon: CreditCardIcon,
    activeIcon: CreditCardIcon,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: UserIcon,
    activeIcon: UserIcon,
  },
]

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = active ? item.activeIcon : item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 transition-colors",
                "min-w-0 px-2"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

