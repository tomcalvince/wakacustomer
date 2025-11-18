"use client"

import * as React from "react"
import { MapPinIcon } from "@heroicons/react/24/outline"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LocationMapDialog } from "@/components/orders/location-map-dialog"
import { geocodeLocation, type GeocodeResult } from "@/lib/services/locations"
import { getUserLocation, getCountryFromCoordinates } from "@/lib/utils/location"
import { formatCoordinates } from "@/lib/utils/coordinates"
import { calculatePricing, type PricingResponse } from "@/lib/services/pricing"
import { RatesDisplay } from "./rates-display"

export function CheckRatesForm() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()

  // Location states
  const [pickupAddress, setPickupAddress] = React.useState("")
  const [pickupCoordinates, setPickupCoordinates] = React.useState<[number, number] | null>(null)
  const [pickupSearchQuery, setPickupSearchQuery] = React.useState("")
  const [pickupGeocodeResults, setPickupGeocodeResults] = React.useState<GeocodeResult[]>([])
  const [isSearchingPickup, setIsSearchingPickup] = React.useState(false)
  const [isPickupMapOpen, setIsPickupMapOpen] = React.useState(false)

  const [deliveryAddress, setDeliveryAddress] = React.useState("")
  const [deliveryCoordinates, setDeliveryCoordinates] = React.useState<[number, number] | null>(null)
  const [deliverySearchQuery, setDeliverySearchQuery] = React.useState("")
  const [deliveryGeocodeResults, setDeliveryGeocodeResults] = React.useState<GeocodeResult[]>([])
  const [isSearchingDelivery, setIsSearchingDelivery] = React.useState(false)
  const [isDeliveryMapOpen, setIsDeliveryMapOpen] = React.useState(false)

  // Weight state
  const [weight, setWeight] = React.useState("")

  // Country code
  const [countryCode, setCountryCode] = React.useState<string>("UG")

  // Rates state
  const [rates, setRates] = React.useState<{
    standard: PricingResponse | null
    express: PricingResponse | null
  } | null>(null)
  const [isRatesDialogOpen, setIsRatesDialogOpen] = React.useState(false)
  const [isCalculating, setIsCalculating] = React.useState(false)

  // Get user location and country on mount
  React.useEffect(() => {
    getUserLocation()
      .then((location) => {
        const country = getCountryFromCoordinates(location.latitude, location.longitude)
        if (country) {
          setCountryCode(country)
        }
      })
      .catch(() => {
        // Continue with default country
      })
  }, [])

  // Geocode pickup location
  React.useEffect(() => {
    if (!pickupSearchQuery.trim() || !session?.accessToken || !session?.refreshToken) {
      setPickupGeocodeResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingPickup(true)
      try {
        if (!session?.accessToken || !session?.refreshToken) return

        const results = await geocodeLocation({
          query: pickupSearchQuery,
          country: countryCode,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          onTokenUpdate: async (newAccessToken, newRefreshToken) => {
            await updateSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
          },
        })

        if (results?.results) {
          setPickupGeocodeResults(results.results)
        } else {
          setPickupGeocodeResults([])
        }
      } catch (error) {
        console.error("Failed to geocode pickup address:", error)
        setPickupGeocodeResults([])
      } finally {
        setIsSearchingPickup(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [pickupSearchQuery, countryCode, session?.accessToken, session?.refreshToken, updateSession])

  // Geocode delivery location
  React.useEffect(() => {
    if (!deliverySearchQuery.trim() || !session?.accessToken || !session?.refreshToken) {
      setDeliveryGeocodeResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingDelivery(true)
      try {
        if (!session?.accessToken || !session?.refreshToken) return

        const results = await geocodeLocation({
          query: deliverySearchQuery,
          country: countryCode,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          onTokenUpdate: async (newAccessToken, newRefreshToken) => {
            await updateSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
          },
        })

        if (results?.results) {
          setDeliveryGeocodeResults(results.results)
        } else {
          setDeliveryGeocodeResults([])
        }
      } catch (error) {
        console.error("Failed to geocode delivery address:", error)
        setDeliveryGeocodeResults([])
      } finally {
        setIsSearchingDelivery(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [deliverySearchQuery, countryCode, session?.accessToken, session?.refreshToken, updateSession])

  const handleSelectPickupLocation = (result: GeocodeResult) => {
    // Format coordinates: max 9 digits total, max 6 decimal places
    const formatted = formatCoordinates([result.latitude, result.longitude])
    setPickupCoordinates([formatted[0], formatted[1]])
    setPickupAddress(result.display_name)
    setPickupSearchQuery("")
    setPickupGeocodeResults([])
    // Open map dialog to allow user to fine-tune the location
    setIsPickupMapOpen(true)
  }

  const handleSelectDeliveryLocation = (result: GeocodeResult) => {
    // Format coordinates: max 9 digits total, max 6 decimal places
    const formatted = formatCoordinates([result.latitude, result.longitude])
    setDeliveryCoordinates([formatted[0], formatted[1]])
    setDeliveryAddress(result.display_name)
    setDeliverySearchQuery("")
    setDeliveryGeocodeResults([])
    // Open map dialog to allow user to fine-tune the location
    setIsDeliveryMapOpen(true)
  }

  const handlePickupMapSelect = (address: string, coordinates: [number, number]) => {
    setPickupAddress(address)
    // Format coordinates: max 9 digits total, max 6 decimal places
    const formatted = formatCoordinates(coordinates)
    setPickupCoordinates([formatted[0], formatted[1]])
    setPickupSearchQuery("")
    setPickupGeocodeResults([])
  }

  const handleDeliveryMapSelect = (address: string, coordinates: [number, number]) => {
    setDeliveryAddress(address)
    // Format coordinates: max 9 digits total, max 6 decimal places
    const formatted = formatCoordinates(coordinates)
    setDeliveryCoordinates([formatted[0], formatted[1]])
    setDeliverySearchQuery("")
    setDeliveryGeocodeResults([])
  }

  const handleCheckRates = async () => {
    if (!pickupCoordinates) {
      toast.error("Please select a pickup location")
      return
    }

    if (!deliveryCoordinates) {
      toast.error("Please select a delivery location")
      return
    }

    if (!weight.trim() || parseFloat(weight) <= 0) {
      toast.error("Please enter a valid weight")
      return
    }

    if (!session?.accessToken || !session?.refreshToken) {
      toast.error("Session expired. Please login again.")
      router.push("/login")
      return
    }

    setIsCalculating(true)

    try {
      // Calculate rates for both standard and express
      const [standardRate, expressRate] = await Promise.all([
        calculatePricing({
          pickup_latitude: pickupCoordinates[0],
          pickup_longitude: pickupCoordinates[1],
          delivery_latitude: deliveryCoordinates[0],
          delivery_longitude: deliveryCoordinates[1],
          service_type: "waka",
          service_level: "standard",
          weight: parseFloat(weight),
          country: countryCode,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          onTokenUpdate: async (newAccessToken, newRefreshToken) => {
            await updateSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
          },
        }),
        calculatePricing({
          pickup_latitude: pickupCoordinates[0],
          pickup_longitude: pickupCoordinates[1],
          delivery_latitude: deliveryCoordinates[0],
          delivery_longitude: deliveryCoordinates[1],
          service_type: "waka",
          service_level: "express",
          weight: parseFloat(weight),
          country: countryCode,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          onTokenUpdate: async (newAccessToken, newRefreshToken) => {
            await updateSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
          },
        }),
      ])

      if (standardRate && expressRate) {
        setRates({
          standard: standardRate,
          express: expressRate,
        })
        setIsRatesDialogOpen(true)
      } else {
        toast.error("Failed to calculate rates. Please try again.")
      }
    } catch (error) {
      console.error("Failed to calculate rates:", error)
      if (error instanceof Error && error.message.includes("Token refresh failed")) {
        await router.push("/login")
        router.refresh()
        return
      }
      toast.error("Failed to calculate rates. Please try again.")
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSwapLocations = () => {
    const tempAddress = pickupAddress
    const tempCoords = pickupCoordinates
    const tempSearch = pickupSearchQuery

    setPickupAddress(deliveryAddress)
    setPickupCoordinates(deliveryCoordinates)
    setPickupSearchQuery(deliverySearchQuery)

    setDeliveryAddress(tempAddress)
    setDeliveryCoordinates(tempCoords)
    setDeliverySearchQuery(tempSearch)

    // Clear geocode results
    setPickupGeocodeResults([])
    setDeliveryGeocodeResults([])
  }

  return (
    <>
      <div className="space-y-6">
        {/* Pickup Location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-teal-500 border-2 border-white shadow-sm" />
            <Label>Pick up Location</Label>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Pick up Location"
                value={pickupSearchQuery}
                onChange={(e) => {
                  setPickupSearchQuery(e.target.value)
                  if (!e.target.value) {
                    setPickupAddress("")
                    setPickupCoordinates(null)
                  }
                }}
                className="h-12 rounded-xl bg-white border"
              />
              {pickupGeocodeResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {pickupGeocodeResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPickupLocation(result)}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPickupMapOpen(true)}
              className="h-12 px-4 rounded-xl shrink-0 bg-teal-50 border-teal-200 hover:bg-teal-100"
              title="Select location on map"
            >
              <MapPinIcon className="h-5 w-5 text-teal-600" />
            </Button>
          </div>
          {pickupAddress && (
            <p className="text-xs text-muted-foreground pl-5">{pickupAddress}</p>
          )}
        </div>

        {/* Connecting Line */}
        <div className="flex items-center gap-2 pl-2">
          <div className="h-8 w-0.5 border-l-2 border-dashed border-teal-300" />
        </div>

        {/* Delivery Location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-teal-500" />
            <Label>Package Destination</Label>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Package Destination"
                value={deliverySearchQuery}
                onChange={(e) => {
                  setDeliverySearchQuery(e.target.value)
                  if (!e.target.value) {
                    setDeliveryAddress("")
                    setDeliveryCoordinates(null)
                  }
                }}
                className="h-12 rounded-xl bg-white border"
              />
              {deliveryGeocodeResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {deliveryGeocodeResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDeliveryLocation(result)}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeliveryMapOpen(true)}
              className="h-12 px-4 rounded-xl shrink-0 bg-teal-50 border-teal-200 hover:bg-teal-100"
              title="Select location on map"
            >
              <MapPinIcon className="h-5 w-5 text-teal-600" />
            </Button>
          </div>
          {deliveryAddress && (
            <p className="text-xs text-muted-foreground pl-7">{deliveryAddress}</p>
          )}
        </div>

        {/* Weight Input */}
        <div className="space-y-2">
          <Label>Dimension</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-12 rounded-xl bg-white border pl-10 pr-12"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              kg
            </div>
          </div>
        </div>

        {/* Check Button */}
        <Button
          type="button"
          onClick={handleCheckRates}
          disabled={isCalculating || !pickupCoordinates || !deliveryCoordinates || !weight.trim()}
          className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
        >
          {isCalculating ? "Calculating..." : "Check"}
        </Button>
      </div>

      {/* Map Dialogs */}
      <LocationMapDialog
        open={isPickupMapOpen}
        onOpenChange={setIsPickupMapOpen}
        onLocationSelect={handlePickupMapSelect}
        initialCoordinates={pickupCoordinates || undefined}
        title="Select Pickup Location"
        country={countryCode}
        accessToken={session?.accessToken || ""}
        refreshToken={session?.refreshToken || ""}
        onTokenUpdate={async (newAccessToken, newRefreshToken) => {
          await updateSession({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        }}
      />

      <LocationMapDialog
        open={isDeliveryMapOpen}
        onOpenChange={setIsDeliveryMapOpen}
        onLocationSelect={handleDeliveryMapSelect}
        initialCoordinates={deliveryCoordinates || undefined}
        title="Select Delivery Location"
        country={countryCode}
        accessToken={session?.accessToken || ""}
        refreshToken={session?.refreshToken || ""}
        onTokenUpdate={async (newAccessToken, newRefreshToken) => {
          await updateSession({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        }}
      />

      {/* Rates Display Dialog */}
      {rates && (
        <RatesDisplay
          open={isRatesDialogOpen}
          onOpenChange={setIsRatesDialogOpen}
          pickupAddress={pickupAddress}
          deliveryAddress={deliveryAddress}
          standardRate={rates.standard}
          expressRate={rates.express}
          onSwapLocations={handleSwapLocations}
        />
      )}
    </>
  )
}

