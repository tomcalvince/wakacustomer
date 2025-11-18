"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LocationPinMap } from "@/components/offices/location-pin-map"
import { reverseGeocodeLocation } from "@/lib/services/locations"
import { formatCoordinates } from "@/lib/utils/coordinates"
import { useSession } from "next-auth/react"
import { MapPinIcon } from "@heroicons/react/24/outline"

interface LocationMapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLocationSelect: (address: string, coordinates: [number, number]) => void
  initialCoordinates?: [number, number]
  title?: string
  country: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export function LocationMapDialog({
  open,
  onOpenChange,
  onLocationSelect,
  initialCoordinates,
  title = "Select Location",
  country,
  accessToken,
  refreshToken,
  onTokenUpdate,
}: LocationMapDialogProps) {
  const { update: updateSession } = useSession()
  const [mapCenter, setMapCenter] = React.useState<[number, number]>(
    initialCoordinates || [0.3476, 32.5825] // Default to Kampala, Uganda
  )
  const [selectedCoordinates, setSelectedCoordinates] = React.useState<[number, number] | null>(
    initialCoordinates || null
  )
  const [address, setAddress] = React.useState<string>("")
  const [isReverseGeocoding, setIsReverseGeocoding] = React.useState(false)

  // Update map center when initial coordinates change
  React.useEffect(() => {
    if (initialCoordinates) {
      setMapCenter(initialCoordinates)
      setSelectedCoordinates(initialCoordinates)
    }
  }, [initialCoordinates])

  // Get user location on mount if no initial coordinates
  React.useEffect(() => {
    if (open && !initialCoordinates) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapCenter([latitude, longitude])
          setSelectedCoordinates([latitude, longitude])
        },
        (error) => {
          console.warn("Failed to get user location:", error)
          // Keep default location
        }
      )
    }
  }, [open, initialCoordinates])

  const handleLocationChange = React.useCallback(
    async (latitude: number, longitude: number) => {
      setSelectedCoordinates([latitude, longitude])
      setAddress("") // Clear previous address while reverse geocoding

      // Reverse geocode the selected location
      setIsReverseGeocoding(true)
      try {
        const result = await reverseGeocodeLocation({
          latitude,
          longitude,
          country,
          accessToken,
          refreshToken,
          onTokenUpdate: async (newAccessToken, newRefreshToken) => {
            await updateSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
            await onTokenUpdate(newAccessToken, newRefreshToken)
          },
        })

        if (result) {
          setAddress(result.display_name)
        } else {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        }
      } catch (error) {
        console.error("Failed to reverse geocode:", error)
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      } finally {
        setIsReverseGeocoding(false)
      }
    },
    [accessToken, refreshToken, onTokenUpdate, updateSession, country]
  )

  const handleConfirm = () => {
    if (!selectedCoordinates) {
      toast.error("Please select a location on the map")
      return
    }

    if (!address) {
      toast.error("Please wait for the address to load")
      return
    }

    // Format coordinates: max 9 digits total, max 6 decimal places
    const formattedCoordinates = formatCoordinates(selectedCoordinates)

    onLocationSelect(address, formattedCoordinates)
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset to initial state when closing
    if (initialCoordinates) {
      setMapCenter(initialCoordinates)
      setSelectedCoordinates(initialCoordinates)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPinIcon className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Instructions */}
          <p className="text-sm text-muted-foreground">
            Click on the map or drag the pin to select your location. The address will be automatically detected.
          </p>

          {/* Map */}
          <div className="w-full">
            <LocationPinMap
              center={mapCenter}
              onLocationChange={handleLocationChange}
              height={400}
              zoom={15}
            />
          </div>

          {/* Selected Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Selected Address</label>
            <div className="p-3 rounded-xl border bg-muted/50 min-h-[60px] flex items-center">
              {isReverseGeocoding ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading address...</span>
                </div>
              ) : address ? (
                <p className="text-sm">{address}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a location on the map to see the address
                </p>
              )}
            </div>
          </div>

          {/* Coordinates Display */}
          {selectedCoordinates && (
            <div className="text-xs text-muted-foreground">
              Coordinates: {selectedCoordinates[0].toFixed(6)}, {selectedCoordinates[1].toFixed(6)}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCoordinates || !address || isReverseGeocoding}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

