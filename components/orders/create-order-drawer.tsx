"use client"

import * as React from "react"
import { ArrowLeftIcon, UserIcon, MapPinIcon } from "@heroicons/react/24/outline"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddParcelDialog } from "./add-parcel-dialog"
import { fetchAgentOffices, type AgentOffice } from "@/lib/services/agent-offices"
import {
  fetchDeliveryWindows,
  createMultiRecipientOrder,
  createDoorToDoorOrder,
  type DeliveryWindow,
  type ParcelPayload,
} from "@/lib/services/orders"
import { formatPhoneNumber } from "@/lib/utils/phone"
import { getUserLocation, getCountryFromCoordinates } from "@/lib/utils/location"
import { formatCoordinates } from "@/lib/utils/coordinates"
import { geocodeLocation, type GeocodeResult } from "@/lib/services/locations"
import { LocationMapDialog } from "./location-map-dialog"

interface Parcel extends ParcelPayload {
  id: string
  description: string
  parcel_name: string
  value: string
  cod: boolean
  amount: string
  size: string
  estimated_weight: number
  recipientName: string
  recipientPhone: string
  specialNotes: string
  deliveryDestination: string
  destination_agent_office: string
  destination_office_name?: string
}

interface CreateOrderDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrderDrawer({ open, onOpenChange }: CreateOrderDrawerProps) {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [deliveryType, setDeliveryType] = React.useState<"dropoff" | "express" | "door-to-door">("dropoff")
  const [agentOffices, setAgentOffices] = React.useState<AgentOffice[]>([])
  const [selectedOriginOffice, setSelectedOriginOffice] = React.useState<string>("")
  const [deliveryWindows, setDeliveryWindows] = React.useState<DeliveryWindow[]>([])
  const [selectedDeliveryWindow, setSelectedDeliveryWindow] = React.useState<string>("")
  const [senderName, setSenderName] = React.useState("")
  const [senderPhone, setSenderPhone] = React.useState("")
  const [parcels, setParcels] = React.useState<Parcel[]>([])
  const [isParcelDialogOpen, setIsParcelDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [countryCode, setCountryCode] = React.useState<string>("KE")
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  
  // Door-to-door specific fields
  const [pickupAddress, setPickupAddress] = React.useState("")
  const [pickupCoordinates, setPickupCoordinates] = React.useState<[string, string]>(["", ""])
  const [deliveryAddress, setDeliveryAddress] = React.useState("")
  const [deliveryCoordinates, setDeliveryCoordinates] = React.useState<[string, string]>(["", ""])
  const [recipientName, setRecipientName] = React.useState("")
  const [recipientPhone, setRecipientPhone] = React.useState("")
  const [specialInstructions, setSpecialInstructions] = React.useState("")
  
  // Geocode search states
  const [pickupSearchQuery, setPickupSearchQuery] = React.useState("")
  const [deliverySearchQuery, setDeliverySearchQuery] = React.useState("")
  const [pickupGeocodeResults, setPickupGeocodeResults] = React.useState<GeocodeResult[]>([])
  const [deliveryGeocodeResults, setDeliveryGeocodeResults] = React.useState<GeocodeResult[]>([])
  const [isSearchingPickup, setIsSearchingPickup] = React.useState(false)
  const [isSearchingDelivery, setIsSearchingDelivery] = React.useState(false)
  
  // Map dialog states
  const [isPickupMapOpen, setIsPickupMapOpen] = React.useState(false)
  const [isDeliveryMapOpen, setIsDeliveryMapOpen] = React.useState(false)

  // Fetch agent offices and delivery windows on mount
  React.useEffect(() => {
    if (!open || !session?.accessToken || !session?.refreshToken) return

    async function loadData() {
      const currentSession = session
      if (!currentSession?.accessToken || !currentSession?.refreshToken) return

      setIsLoading(true)
      
      // Get location in background (non-blocking)
      getUserLocation()
        .then((location) => {
          const country = getCountryFromCoordinates(location.latitude, location.longitude)
          if (country) {
            setCountryCode(country)
          }
        })
        .catch((locationError) => {
          console.warn("Failed to get user location:", locationError)
          // Continue with default country
        })

      try {
        // Fetch agent offices and delivery windows in parallel for faster loading
        const [offices, windows] = await Promise.all([
          fetchAgentOffices({
            accessToken: currentSession.accessToken,
            refreshToken: currentSession.refreshToken,
            onTokenUpdate: async (newAccessToken, newRefreshToken) => {
              await updateSession({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              })
            },
          }),
          fetchDeliveryWindows({
            accessToken: currentSession.accessToken,
            refreshToken: currentSession.refreshToken,
            onTokenUpdate: async (newAccessToken, newRefreshToken) => {
              await updateSession({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              })
            },
          }),
        ])

        // Set agent offices
        if (offices.length > 0) {
          setAgentOffices(offices)
          // Preselect first office
          setSelectedOriginOffice(offices[0].id)
        }

        // Set delivery windows
        const activeWindows = windows.filter((w) => w.is_active)
        setDeliveryWindows(activeWindows)
        // Preselect first active window
        if (activeWindows.length > 0) {
          setSelectedDeliveryWindow(activeWindows[0].window_type)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        if (error instanceof Error && error.message.includes("Token refresh failed")) {
          await signOut({ redirect: false })
          router.push("/login")
          router.refresh()
          return
        }
        toast.error("Failed to load form data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [open, session?.accessToken, session?.refreshToken, updateSession, router, session])

  // Geocode search for pickup address
  React.useEffect(() => {
    if (!pickupSearchQuery.trim() || pickupSearchQuery.length < 3) {
      setPickupGeocodeResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      if (!session?.accessToken || !session?.refreshToken) return
      
      setIsSearchingPickup(true)
      try {
        const results = await geocodeLocation({
          query: pickupSearchQuery,
          country: countryCode,
          limit: 5,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          onTokenUpdate: async (newAccessToken, newRefreshToken) => {
            await updateSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
          },
        })
        setPickupGeocodeResults(results?.results || [])
      } catch (error) {
        console.error("Failed to geocode pickup address:", error)
        setPickupGeocodeResults([])
      } finally {
        setIsSearchingPickup(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [pickupSearchQuery, countryCode, session?.accessToken, session?.refreshToken, updateSession])

  // Geocode search for delivery address
  React.useEffect(() => {
    if (!deliverySearchQuery.trim() || deliverySearchQuery.length < 3) {
      setDeliveryGeocodeResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      if (!session?.accessToken || !session?.refreshToken) return
      
      setIsSearchingDelivery(true)
      try {
        const results = await geocodeLocation({
          query: deliverySearchQuery,
          country: countryCode,
          limit: 5,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          onTokenUpdate: async (newAccessToken, newRefreshToken) => {
            await updateSession({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
          },
        })
        setDeliveryGeocodeResults(results?.results || [])
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
    setPickupCoordinates([formatted[0].toString(), formatted[1].toString()])
    setPickupSearchQuery("")
    setPickupGeocodeResults([])
    // Open map dialog to allow user to fine-tune the location
    setIsPickupMapOpen(true)
  }

  const handleSelectDeliveryLocation = (result: GeocodeResult) => {
    // Format coordinates: max 9 digits total, max 6 decimal places
    const formatted = formatCoordinates([result.latitude, result.longitude])
    setDeliveryCoordinates([formatted[0].toString(), formatted[1].toString()])
    setDeliverySearchQuery("")
    setDeliveryGeocodeResults([])
    // Open map dialog to allow user to fine-tune the location
    setIsDeliveryMapOpen(true)
  }

  const handlePickupMapSelect = (address: string, coordinates: [number, number]) => {
    setPickupAddress(address)
    // Format coordinates: max 9 digits total, max 6 decimal places
    const formatted = formatCoordinates(coordinates)
    setPickupCoordinates([formatted[0].toString(), formatted[1].toString()])
    setPickupSearchQuery("")
    setPickupGeocodeResults([])
  }

  const handleDeliveryMapSelect = (address: string, coordinates: [number, number]) => {
    setDeliveryAddress(address)
    // Format coordinates: max 9 digits total, max 6 decimal places
    const formatted = formatCoordinates(coordinates)
    setDeliveryCoordinates([formatted[0].toString(), formatted[1].toString()])
    setDeliverySearchQuery("")
    setDeliveryGeocodeResults([])
  }

  const handleAddParcel = (parcelData: {
    description: string
    value: string
    cod: boolean
    amount: string
    size: string
    estimated_weight: number
    recipientName: string
    recipientPhone: string
    specialNotes: string
    deliveryDestination: string
    destination_agent_office: string
  }) => {
    const newParcel: Parcel = {
      id: Date.now().toString(),
      description: parcelData.description,
      parcel_name: parcelData.description,
      value: parcelData.value,
      cod: parcelData.cod,
      amount: parcelData.amount,
      size: parcelData.size,
      estimated_weight: parcelData.estimated_weight,
      recipientName: parcelData.recipientName,
      recipientPhone: parcelData.recipientPhone,
      specialNotes: parcelData.specialNotes,
      deliveryDestination: parcelData.deliveryDestination,
      destination_agent_office: parcelData.destination_agent_office,
      destination_office_name: parcelData.deliveryDestination,
      declared_value: parcelData.value ? parseFloat(parcelData.value) : undefined,
      recipient_name: parcelData.recipientName,
      recipient_phone: formatPhoneNumber(parcelData.recipientPhone),
      special_instructions: parcelData.specialNotes || undefined,
    }
    setParcels([...parcels, newParcel])
    setIsParcelDialogOpen(false)
  }

  const handleRemoveParcel = (id: string) => {
    setParcels(parcels.filter((p) => p.id !== id))
  }

  const handleSubmit = () => {
    // Common validation
    if (!senderName.trim()) {
      toast.error("Please enter sender name")
      return
    }

    if (!senderPhone.trim()) {
      toast.error("Please enter sender phone")
      return
    }

    if (parcels.length === 0) {
      toast.error("Please add at least one parcel")
      return
    }

    // Door-to-door specific validation
    if (deliveryType === "door-to-door") {
      if (!pickupAddress.trim()) {
        toast.error("Please enter pickup address")
        return
      }

      if (!pickupCoordinates[0] || !pickupCoordinates[1]) {
        toast.error("Please select a valid pickup location")
        return
      }

      if (!deliveryAddress.trim()) {
        toast.error("Please enter delivery address")
        return
      }

      if (!deliveryCoordinates[0] || !deliveryCoordinates[1]) {
        toast.error("Please select a valid delivery location")
        return
      }

      if (!selectedDeliveryWindow) {
        toast.error("Please select a delivery time")
        return
      }

      if (!recipientName.trim()) {
        toast.error("Please enter recipient name")
        return
      }

      if (!recipientPhone.trim()) {
        toast.error("Please enter recipient phone")
        return
      }
    } else {
      // Waka-agent validation
      if (!selectedOriginOffice) {
        toast.error("Please select an origin office")
        return
      }

      if (!selectedDeliveryWindow) {
        toast.error("Please select a delivery time")
        return
      }

      // Validate all parcels have required fields
      for (const parcel of parcels) {
        if (!parcel.destination_agent_office) {
          toast.error(`Parcel "${parcel.parcel_name}" is missing destination office`)
          return
        }
      }
    }

    // Show confirmation dialog
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    if (!session?.accessToken || !session?.refreshToken) {
      toast.error("Session expired. Please login again.")
      setShowConfirmDialog(false)
      return
    }

    setIsSubmitting(true)
    setShowConfirmDialog(false)

    try {
      // Format phone numbers
      const formattedSenderPhone = formatPhoneNumber(senderPhone)

      if (deliveryType === "door-to-door") {
        // Door-to-door order
        const formattedRecipientPhone = formatPhoneNumber(recipientPhone)

        const parcelPayloads = parcels.map((parcel) => ({
          parcel_name: parcel.parcel_name,
          estimated_weight: parcel.estimated_weight,
          size: parcel.size,
          declared_value: parcel.declared_value,
          cod: parcel.cod || false,
          cod_amount: parcel.cod ? parseFloat(parcel.amount) || 0 : 0,
        }))

        // Format coordinates: max 9 digits total, max 6 decimal places
        const pickupCoords: [number, number] = formatCoordinates([
          parseFloat(pickupCoordinates[0]),
          parseFloat(pickupCoordinates[1]),
        ])
        const deliveryCoords: [number, number] = formatCoordinates([
          parseFloat(deliveryCoordinates[0]),
          parseFloat(deliveryCoordinates[1]),
        ])

        try {
          const result = await createDoorToDoorOrder({
            sender: senderName.trim(),
            sender_phone: formattedSenderPhone,
            pickup_address: pickupAddress.trim(),
            pickup_coordinates: pickupCoords,
            delivery_address: deliveryAddress.trim(),
            delivery_coordinates: deliveryCoords,
            delivery_time: selectedDeliveryWindow,
            service_level: "standard",
            parcels: parcelPayloads,
            recipient_name: recipientName.trim(),
            recipient_phone: formattedRecipientPhone,
            special_instructions: specialInstructions.trim() || undefined,
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            onTokenUpdate: async (newAccessToken, newRefreshToken) => {
              await updateSession({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              })
            },
          })

          if (result) {
            toast.success(`Order ${result.order_number} created successfully!`)
            handleClose()
          } else {
            toast.error("Failed to create order. Please try again.")
          }
        } catch (walletError: any) {
          // Handle insufficient wallet balance error
          if (walletError.message === "INSUFFICIENT_WALLET_BALANCE" && walletError.errorData) {
            const errorData = walletError.errorData
            const message = errorData.message || "Order will not be available to riders until payment is finalized"
            toast.warning(
              `Insufficient wallet balance. Required: ${errorData.required}, Available: ${errorData.available}. ${message}`,
              { duration: 6000 }
            )
            handleClose()
            return
          }
          throw walletError // Re-throw if it's not a wallet balance error
        }
      } else {
        // Waka-agent order
        const parcelPayloads: ParcelPayload[] = parcels.map((parcel) => ({
          parcel_name: parcel.parcel_name,
          estimated_weight: parcel.estimated_weight,
          size: parcel.size,
          declared_value: parcel.declared_value,
          recipient_name: parcel.recipient_name,
          recipient_phone: formatPhoneNumber(parcel.recipientPhone),
          destination_agent_office: parcel.destination_agent_office,
          special_instructions: parcel.special_instructions,
        }))

        try {
          const result = await createMultiRecipientOrder({
            origin_agent_office: selectedOriginOffice,
            sender_name: senderName.trim(),
            sender_phone: formattedSenderPhone,
            service_option: "drop-off",
            service_level: deliveryType === "dropoff" ? "standard" : "express",
            delivery_time: selectedDeliveryWindow,
            parcels: parcelPayloads,
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            onTokenUpdate: async (newAccessToken, newRefreshToken) => {
              await updateSession({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              })
            },
          })

          if (result) {
            toast.success(`Order ${result.order_number} created successfully!`)
            handleClose()
          } else {
            toast.error("Failed to create order. Please try again.")
          }
        } catch (walletError: any) {
          // Handle insufficient wallet balance error
          if (walletError.message === "INSUFFICIENT_WALLET_BALANCE" && walletError.errorData) {
            const errorData = walletError.errorData
            const message = errorData.message || "Order will not be available to riders until payment is finalized"
            toast.warning(
              `Insufficient wallet balance. Required: ${errorData.required}, Available: ${errorData.available}. ${message}`,
              { duration: 6000 }
            )
            handleClose()
            return
          }
          throw walletError // Re-throw if it's not a wallet balance error
        }
      }
    } catch (error) {
      console.error("Failed to create order:", error)
      if (error instanceof Error && error.message.includes("Token refresh failed")) {
        await signOut({ redirect: false })
        router.push("/login")
        router.refresh()
        return
      }
      toast.error("Failed to create order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form when closing
    setDeliveryType("dropoff")
    setSelectedOriginOffice("")
    setSelectedDeliveryWindow("")
    setSenderName("")
    setSenderPhone("")
    setParcels([])
    // Reset door-to-door fields
    setPickupAddress("")
    setPickupCoordinates(["", ""])
    setDeliveryAddress("")
    setDeliveryCoordinates(["", ""])
    setRecipientName("")
    setRecipientPhone("")
    setSpecialInstructions("")
    setPickupSearchQuery("")
    setDeliverySearchQuery("")
    setPickupGeocodeResults([])
    setDeliveryGeocodeResults([])
  }

  const selectedOriginOfficeData = agentOffices.find((o) => o.id === selectedOriginOffice)

  return (
    <>
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="rounded-t-3xl max-h-[95vh]">
          <DrawerHeader className="px-4 pb-2">
            <div className="flex items-center gap-3">
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <ArrowLeftIcon className="h-5 w-5" />
                </Button>
              </DrawerClose>
              <DrawerTitle className="text-lg font-semibold">Create Delivery</DrawerTitle>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto flex-1 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground text-sm">Loading...</p>
              </div>
            ) : (
              <>
                {/* Delivery Type Selection */}
                <Tabs
                  value={deliveryType}
                  onValueChange={(value) => setDeliveryType(value as "dropoff" | "express" | "door-to-door")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 h-12 bg-muted">
                    <TabsTrigger
                      value="dropoff"
                      className="text-xs font-medium"
                    >
                      WAKA-DROPOFF
                    </TabsTrigger>
                    <TabsTrigger
                      value="express"
                      className="text-xs font-medium"
                    >
                      WAKA-EXPRESS
                    </TabsTrigger>
                    <TabsTrigger
                      value="door-to-door"
                      className="text-xs font-medium"
                    >
                      DOOR-TO-DOOR
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* From Agent Selection - Only show for waka-agent orders */}
                {deliveryType !== "door-to-door" && (
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Select value={selectedOriginOffice} onValueChange={setSelectedOriginOffice}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select Agent Office">
                          {selectedOriginOfficeData?.office_name || "Select Agent Office"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {agentOffices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.office_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Pickup Address - Only for door-to-door */}
                {deliveryType === "door-to-door" && (
                  <>
                    <div className="space-y-2">
                      <Label>Pickup Address</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type="text"
                            placeholder="Search pickup address..."
                            value={pickupSearchQuery}
                            onChange={(e) => {
                              setPickupSearchQuery(e.target.value)
                              if (!e.target.value) {
                                setPickupAddress("")
                                setPickupCoordinates(["", ""])
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
                          onClick={() => {
                            const coords: [number, number] | undefined = 
                              pickupCoordinates[0] && pickupCoordinates[1]
                                ? [parseFloat(pickupCoordinates[0]), parseFloat(pickupCoordinates[1])]
                                : undefined
                            setIsPickupMapOpen(true)
                          }}
                          className="h-12 px-4 rounded-xl shrink-0"
                          title="Select location on map"
                        >
                          <MapPinIcon className="h-5 w-5" />
                        </Button>
                      </div>
                      {pickupAddress && (
                        <p className="text-xs text-muted-foreground">{pickupAddress}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Delivery Address</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type="text"
                            placeholder="Search delivery address..."
                            value={deliverySearchQuery}
                            onChange={(e) => {
                              setDeliverySearchQuery(e.target.value)
                              if (!e.target.value) {
                                setDeliveryAddress("")
                                setDeliveryCoordinates(["", ""])
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
                          onClick={() => {
                            const coords: [number, number] | undefined = 
                              deliveryCoordinates[0] && deliveryCoordinates[1]
                                ? [parseFloat(deliveryCoordinates[0]), parseFloat(deliveryCoordinates[1])]
                                : undefined
                            setIsDeliveryMapOpen(true)
                          }}
                          className="h-12 px-4 rounded-xl shrink-0"
                          title="Select location on map"
                        >
                          <MapPinIcon className="h-5 w-5" />
                        </Button>
                      </div>
                      {deliveryAddress && (
                        <p className="text-xs text-muted-foreground">{deliveryAddress}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Recipient Name</Label>
                      <Input
                        type="text"
                        placeholder="Recipient Name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="h-12 rounded-xl bg-white border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Recipient Phone</Label>
                      <Input
                        type="tel"
                        placeholder="Recipient Phone"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="h-12 rounded-xl bg-white border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Special Instructions (Optional)</Label>
                      <Input
                        type="text"
                        placeholder="Special instructions..."
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        className="h-12 rounded-xl bg-white border"
                      />
                    </div>
                  </>
                )}

                {/* Delivery Time Selection */}
                <div className="space-y-2">
                  <Label>Delivery Time</Label>
                  <Select
                    value={selectedDeliveryWindow}
                    onValueChange={setSelectedDeliveryWindow}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select Delivery Time">
                        {deliveryWindows.find((w) => w.window_type === selectedDeliveryWindow)
                          ?.window_type_display || "Select Delivery Time"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryWindows.map((window) => (
                        <SelectItem key={window.id} value={window.window_type}>
                          {window.window_type_display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sender Name */}
                <div className="space-y-2">
                  <Label>Sender Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Sender Name"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-white border"
                    />
                  </div>
                </div>

                {/* Sender Phone */}
                <div className="space-y-2">
                  <Label>Sender Phone</Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-2">
                      <span className="text-lg">🇺🇬</span>
                      <svg
                        className="h-4 w-4 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                    <Input
                      type="tel"
                      placeholder="phone number"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="pl-16 h-12 rounded-xl bg-white border"
                    />
                  </div>
                </div>

                {/* Parcels Section */}
                <div className="space-y-3">
                  <Label>Parcels</Label>

                  {/* Display added parcels */}
                  {parcels.length > 0 && (
                    <div className="space-y-2">
                      {parcels.map((parcel) => (
                        <div
                          key={parcel.id}
                          className="flex items-center justify-between p-3 rounded-xl border bg-background"
                        >
                          <span className="text-sm font-medium">{parcel.parcel_name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveParcel(parcel.id)}
                            className="h-8 text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Parcel Button */}
                  <Button
                    type="button"
                    onClick={() => setIsParcelDialogOpen(true)}
                    className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  >
                    {parcels.length > 0 ? "Add Another Parcel" : "Add Parcel"}
                  </Button>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  >
                    {isSubmitting ? "Creating Order..." : "Create Order"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <AddParcelDialog
        open={isParcelDialogOpen}
        onOpenChange={setIsParcelDialogOpen}
        onAddParcel={handleAddParcel}
        countryCode={countryCode}
        accessToken={session?.accessToken || ""}
        refreshToken={session?.refreshToken || ""}
        onTokenUpdate={async (newAccessToken, newRefreshToken) => {
          await updateSession({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        }}
        isDoorToDoor={deliveryType === "door-to-door"}
      />

      {/* Pickup Location Map Dialog */}
      <LocationMapDialog
        open={isPickupMapOpen}
        onOpenChange={setIsPickupMapOpen}
        onLocationSelect={handlePickupMapSelect}
        initialCoordinates={
          pickupCoordinates[0] && pickupCoordinates[1]
            ? [parseFloat(pickupCoordinates[0]), parseFloat(pickupCoordinates[1])]
            : undefined
        }
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

      {/* Delivery Location Map Dialog */}
      <LocationMapDialog
        open={isDeliveryMapOpen}
        onOpenChange={setIsDeliveryMapOpen}
        onLocationSelect={handleDeliveryMapSelect}
        initialCoordinates={
          deliveryCoordinates[0] && deliveryCoordinates[1]
            ? [parseFloat(deliveryCoordinates[0]), parseFloat(deliveryCoordinates[1])]
            : undefined
        }
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Confirm Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Service Type */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Service Type</Label>
              <p className="text-sm font-medium">
                {deliveryType === "dropoff" ? "WAKA-DROPOFF" : deliveryType === "express" ? "WAKA-EXPRESS" : "DOOR-TO-DOOR"}
              </p>
            </div>

            {/* Origin Office - Only for waka-agent */}
            {deliveryType !== "door-to-door" && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <p className="text-sm font-medium">{selectedOriginOfficeData?.office_name}</p>
              </div>
            )}

            {/* Pickup/Delivery Addresses - Only for door-to-door */}
            {deliveryType === "door-to-door" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Pickup Address</Label>
                  <p className="text-sm font-medium">{pickupAddress}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Delivery Address</Label>
                  <p className="text-sm font-medium">{deliveryAddress}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Recipient</Label>
                  <p className="text-sm font-medium">
                    {recipientName} ({formatPhoneNumber(recipientPhone)})
                  </p>
                </div>
                {specialInstructions && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Special Instructions</Label>
                    <p className="text-sm font-medium">{specialInstructions}</p>
                  </div>
                )}
              </>
            )}

            {/* Delivery Time */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Delivery Time</Label>
              <p className="text-sm font-medium">
                {deliveryWindows.find((w) => w.window_type === selectedDeliveryWindow)
                  ?.window_type_display || selectedDeliveryWindow}
              </p>
            </div>

            {/* Sender Info */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Sender Information</Label>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {senderName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {formatPhoneNumber(senderPhone)}
                </p>
              </div>
            </div>

            {/* Parcels Summary */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs text-muted-foreground">
                Parcels ({parcels.length})
              </Label>
              <div className="space-y-2">
                {parcels.map((parcel, index) => (
                  <div
                    key={parcel.id}
                    className="p-3 rounded-xl border bg-muted/50 space-y-1"
                  >
                    <p className="text-sm font-medium">
                      {index + 1}. {parcel.parcel_name}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        <span className="font-medium">Size:</span> {parcel.size} (
                        {parcel.estimated_weight} kg)
                      </p>
                      <p>
                        <span className="font-medium">Value:</span> {parcel.declared_value}
                      </p>
                      {deliveryType !== "door-to-door" && (
                        <>
                          <p>
                            <span className="font-medium">Recipient:</span> {parcel.recipient_name} (
                            {formatPhoneNumber(parcel.recipientPhone)})
                          </p>
                          <p>
                            <span className="font-medium">Destination:</span>{" "}
                            {parcel.destination_office_name || "Unknown"}
                          </p>
                        </>
                      )}
                      {parcel.cod && (
                        <p>
                          <span className="font-medium">COD Amount:</span> {parcel.amount}
                        </p>
                      )}
                      {parcel.special_instructions && (
                        <p>
                          <span className="font-medium">Notes:</span> {parcel.special_instructions}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSubmitting ? "Creating..." : "Confirm & Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
