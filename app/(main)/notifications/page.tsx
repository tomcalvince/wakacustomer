import React from 'react'
import { DesktopNotifications, MobileNotifications } from '@/components/dashboard/notifications'

export default function NotificationsPage() {
  return (
    <div className="md:p-6 p-0">
      <div className="md:hidden">
        <MobileNotifications />
      </div>
      <div className="hidden md:block">
        <DesktopNotifications />
      </div>
    </div>
  )
}