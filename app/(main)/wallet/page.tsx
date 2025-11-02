"use client";

import React from "react";
import MobileWallet from "@/components/shared/mobile-wallet";
import MobilePageHeader from "@/components/shared/mobile-page-header";

export default function WalletPage() {
  return (
    <div className="flex flex-1 flex-col md:gap-6 gap-0 md:p-6 pt-2 h-full">
      {/* mobile header */}
      <MobilePageHeader title="Wallet" rightSlot={''}/>
      {/* Mobile Wallet Component */}      
      <div className="md:hidden flex-1 min-h-0">
        <MobileWallet />
      </div>
    </div>
  );
}

