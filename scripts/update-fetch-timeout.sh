#!/bin/bash
# Script to update all route.ts files to use fetchWithTimeout

FILES=(
  "app/api/orders/door-to-door/route.ts"
  "app/api/orders/[id]/route.ts"
  "app/api/orders/[id]/mark-as-paid/route.ts"
  "app/api/orders/tracking/[trackingNumber]/route.ts"
  "app/api/wallet/transactions/route.ts"
  "app/api/auth/login/route.ts"
  "app/api/auth/register/route.ts"
  "app/api/auth/refresh/route.ts"
  "app/api/agent-offices/route.ts"
  "app/api/agent-offices/[id]/route.ts"
  "app/api/agent-offices/nearby-by-location/route.ts"
  "app/api/locations/geocode/route.ts"
  "app/api/navigation/directions/route.ts"
  "app/api/delivery-windows/route.ts"
  "app/api/profile/image/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    # Add import if not present
    if ! grep -q "fetchWithTimeout" "$file"; then
      sed -i '/^import.*BASE_URL.*API_URLS/a import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"' "$file"
    fi
  fi
done

echo "Done!"

