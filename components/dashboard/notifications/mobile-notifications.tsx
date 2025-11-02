"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SAMPLE_NOTIFICATIONS, categoryColor, type NotificationItem } from "./desktop-notifications"
import { MobilePageHeader } from "@/components/shared"

export function MobileNotifications() {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<NotificationItem | null>(null)

  const onSelect = (n: NotificationItem) => {
    setSelected(n)
    setOpen(true)
  }

  // Lightweight date grouping derived from `date` string demo values
  const groupLabel = (d: string) => {
    if (d.includes("AM") || d.includes("PM") || d === "Today") return "Today"
    if (d.includes("Yesterday")) return "Yesterday"
    return d
  }

  const grouped = SAMPLE_NOTIFICATIONS.reduce<Record<string, NotificationItem[]>>((acc, n) => {
    const key = groupLabel(n.date)
    acc[key] ||= []
    acc[key].push(n)
    return acc
  }, {})

  const groups = Object.entries(grouped)

  return (
    <div className="md:hidden w-full">
      <MobilePageHeader title="Notifications" />
      <Separator />

      <div className="px-2 pb-4">
        {groups.map(([label, items]) => (
          <div key={label} className="mb-4">
            <div className="px-1 py-2 text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className="rounded-xl bg-background">
              {items.map((n, idx) => (
                <button
                  key={n.id}
                  onClick={() => onSelect(n)}
                  className={cn(
                    "w-full text-left px-3 py-4 flex items-start gap-3",
                    idx !== items.length - 1 && "border-b border-border/60"
                  )}
                >
                  {/* Leading icon placeholder via Avatar */}
                  <div className="mt-0.5">
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", categoryColor(n.category))}>
                      <span className="text-[11px] font-semibold">{n.category[0]}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm truncate">{n.title}</div>
                      <div className="text-[11px] text-muted-foreground ml-2 shrink-0">{n.date}</div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{n.subtitle}</div>
                    <div className="mt-1">
                      <Badge variant="secondary" className="font-normal text-[11px]">{n.tag}</Badge>
                    </div>
                  </div>
                  {n.unread && (
                    <div className="ml-2 mt-1 h-5 w-5 rounded-full bg-primary text-background text-[11px] flex items-center justify-center">4</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85vh]">
          {selected && (
            <div className="overflow-y-auto">
              <DrawerHeader className="pb-2">
                <DrawerTitle className="text-base">{selected.title}</DrawerTitle>
                <DrawerDescription>{selected.date} • {selected.tag}</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-6">
                <div className="rounded-md border bg-muted/30 p-4 text-sm">
                  <div className="font-medium mb-1">{selected.category}</div>
                  <div>{selected.subtitle}</div>
                  {selected.amount && (
                    <div className="mt-2 font-semibold">{selected.amount}</div>
                  )}
                </div>

                {selected.customerName && (
                  <div>
                    <div className="font-semibold mb-2">Customer</div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{selected.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{selected.customerName}</div>
                        <div className="text-xs text-muted-foreground">Active Customer</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button className="flex-1">Mark as Read</Button>
                  <Button variant="outline" className="flex-1">Delete</Button>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default MobileNotifications


