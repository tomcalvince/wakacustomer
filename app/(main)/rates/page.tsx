"use client"

import { MobilePageHeader } from "@/components/shared/mobile-page-header"
import { CheckRatesForm } from "@/components/rates/check-rates-form"

export default function RatesPage() {
  return (
    <div className="flex flex-1 flex-col md:gap-6 gap-0 md:p-6 p-0 h-full">
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobilePageHeader title="Check Rates" />
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold mb-6">Check Rates</h1>
      </div>

      {/* Form Content */}
      <div className="flex-1 md:max-w-2xl md:mx-auto w-full px-4 md:px-0 py-6 md:py-0">
        <CheckRatesForm />
      </div>
    </div>
  )
}

