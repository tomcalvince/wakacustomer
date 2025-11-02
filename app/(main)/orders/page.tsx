"use client";

import React, { useState } from 'react';
import MobileOrdersList from '@/components/shared/mobile-orders-list';
import { RecentOrdersTable } from '@/components/shared';
import MobilePageHeader from '@/components/shared/mobile-page-header';
import { OrderDirection } from '@/types/orders';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FunnelIcon } from '@heroicons/react/24/outline';

function DirectionFilter({
  direction,
  onDirectionChange,
}: {
  direction: OrderDirection;
  onDirectionChange: (direction: OrderDirection) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label="Filter by direction"
          className="h-10 w-10 flex items-center justify-center rounded-full"
        >
          <FunnelIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onDirectionChange("all")}
          className={direction === "all" ? "bg-accent" : ""}
        >
          All
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDirectionChange("incoming")}
          className={direction === "incoming" ? "bg-accent" : ""}
        >
          Incoming
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDirectionChange("outgoing")}
          className={direction === "outgoing" ? "bg-accent" : ""}
        >
          Outgoing
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const OrdersPage = () => {
  const [directionFilter, setDirectionFilter] = useState<OrderDirection>("all");

  return (
    <div className="flex flex-1 flex-col md:gap-6 gap-0 md:p-6 p-0 h-full">
      {/* Mobile Page Header (shared component) */}
      <MobilePageHeader
        title="Orders"
        rightSlot={
          <DirectionFilter
            direction={directionFilter}
            onDirectionChange={setDirectionFilter}
          />
        }
      />

      {/* Mobile Orders List */}
      <div className="md:hidden">
        <MobileOrdersList showHeader={false} directionFilter={directionFilter} />
      </div>

      {/* Desktop Orders Table */}
      <div className="hidden md:block">
        <RecentOrdersTable />
      </div>
    </div>
  );
};

export default OrdersPage;