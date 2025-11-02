"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { searchAgentOfficesByLocation, type AgentOffice } from "@/lib/services/agent-offices"
import { formatPhoneNumber } from "@/lib/utils/phone"
import { CheckIcon } from "@heroicons/react/24/outline"

interface AddParcelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddParcel: (data: {
    description: string
    value: string
    cod: boolean
    amount: string
    size: string
    recipientName: string
    recipientPhone: string
    specialNotes: string
    deliveryDestination: string
    destination_agent_office: string
  }) => void
  countryCode: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

const SIZES = [
  { value: "small", label: "Small", weight: "< 1 kg" },
  { value: "medium", label: "Medium", weight: "1 - 5 kg" },
  { value: "large", label: "Large", weight: "5 - 15 kg" },
  { value: "xlarge", label: "X-Large", weight: "> 15 kg" },
]

export function AddParcelDialog({
  open,
  onOpenChange,
  onAddParcel,
  countryCode,
  accessToken,
  refreshToken,
  onTokenUpdate,
}: AddParcelDialogProps) {
  const [description, setDescription] = React.useState("")
  const [value, setValue] = React.useState("")
  const [cod, setCod] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [selectedSize, setSelectedSize] = React.useState<string>("")
  const [recipientName, setRecipientName] = React.useState("")
  const [recipientPhone, setRecipientPhone] = React.useState("")
  const [specialNotes, setSpecialNotes] = React.useState("")
  const [deliveryLocationSearch, setDeliveryLocationSearch] = React.useState("")
  const [destinationOffices, setDestinationOffices] = React.useState<AgentOffice[]>([])
  const [selectedDestinationOffice, setSelectedDestinationOffice] = React.useState<string>("")
  const [isSearching, setIsSearching] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Debounced search for destination offices
  React.useEffect(() => {
    if (!deliveryLocationSearch.trim() || deliveryLocationSearch.length < 3) {
      setDestinationOffices([])
      setSelectedDestinationOffice("")
      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const offices = await searchAgentOfficesByLocation({
          country: countryCode,
          location_name: deliveryLocationSearch,
          radius_km: 10,
          accessToken,
          refreshToken,
          onTokenUpdate,
        })
        setDestinationOffices(offices)
        // Auto-select first result if only one
        if (offices.length === 1) {
          setSelectedDestinationOffice(offices[0].id)
        } else {
          setSelectedDestinationOffice("")
        }
      } catch (error) {
        console.error("Failed to search offices:", error)
        setDestinationOffices([])
        setSelectedDestinationOffice("")
      } finally {
        setIsSearching(false)
      }
    }, 500) // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [deliveryLocationSearch, countryCode, accessToken, refreshToken, onTokenUpdate])

  const handleSubmit = () => {
    if (!description || !selectedSize || !recipientName || !recipientPhone) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!selectedDestinationOffice) {
      toast.error("Please select a destination office")
      return
    }

    const selectedOffice = destinationOffices.find((o) => o.id === selectedDestinationOffice)
    if (!selectedOffice) {
      toast.error("Please select a valid destination office")
      return
    }

    onAddParcel({
      description,
      value,
      cod,
      amount: cod ? amount : "",
      size: selectedSize,
      recipientName,
      recipientPhone,
      specialNotes,
      deliveryDestination: selectedOffice.office_name,
      destination_agent_office: selectedDestinationOffice,
    })

    // Reset form
    setDescription("")
    setValue("")
    setCod(false)
    setAmount("")
    setSelectedSize("")
    setRecipientName("")
    setRecipientPhone("")
    setSpecialNotes("")
    setDeliveryLocationSearch("")
    setDestinationOffices([])
    setSelectedDestinationOffice("")
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form when closing
    setDescription("")
    setValue("")
    setCod(false)
    setAmount("")
    setSelectedSize("")
    setRecipientName("")
    setRecipientPhone("")
    setSpecialNotes("")
    setDeliveryLocationSearch("")
    setDestinationOffices([])
    setSelectedDestinationOffice("")
  }

  const selectedDestinationOfficeData = destinationOffices.find(
    (o) => o.id === selectedDestinationOffice
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add Parcel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              type="text"
              placeholder="eg. Light bulbs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          {/* Value */}
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              type="number"
              placeholder="Value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          {/* COD */}
          <div className="space-y-2">
            <Label>COD</Label>
            <div className="flex gap-2">
              <Button
                variant={cod ? "default" : "outline"}
                onClick={() => setCod(true)}
                className={cn(
                  "flex-1 h-12 rounded-xl",
                  cod
                    ? "bg-foreground text-background"
                    : "bg-background border border-border"
                )}
              >
                YES
              </Button>
              <Button
                variant={!cod ? "default" : "outline"}
                onClick={() => setCod(false)}
                className={cn(
                  "flex-1 h-12 rounded-xl",
                  !cod
                    ? "bg-foreground text-background"
                    : "bg-background border border-border"
                )}
              >
                NO
              </Button>
            </div>
          </div>

          {/* Amount (if COD is YES) */}
          {cod && (
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          )}

          {/* Size Selection */}
          <div className="space-y-2">
            <Label>Size</Label>
            <div className="grid grid-cols-2 gap-2">
              {SIZES.map((size) => (
                <Button
                  key={size.value}
                  variant={selectedSize === size.value ? "default" : "outline"}
                  onClick={() => setSelectedSize(size.value)}
                  className={cn(
                    "h-20 flex flex-col items-center justify-center gap-1 rounded-xl",
                    selectedSize === size.value
                      ? "bg-foreground text-background"
                      : "bg-background border border-border"
                  )}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  <span className="text-xs font-medium">{size.label}</span>
                  <span className="text-xs opacity-80">{size.weight}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Recipient Name */}
          <div className="space-y-2">
            <Label>Recipient Name</Label>
            <Input
              type="text"
              placeholder="Recipient Name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          {/* Recipient Phone */}
          <div className="space-y-2">
            <Label>Recipient Phone</Label>
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
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="pl-16 h-12 rounded-xl"
              />
            </div>
          </div>

          {/* Special Notes */}
          <div className="space-y-2">
            <Label>Special notes</Label>
            <Textarea
              placeholder="Special notes"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="min-h-[100px] rounded-xl resize-none"
            />
          </div>

          {/* Delivery Destination Search */}
          <div className="space-y-2">
            <Label>Delivery Destination</Label>
            <div className="relative">
              {/* Pentagon icon for agent selector */}
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <Input
                type="text"
                placeholder="Search by location (e.g. Nairobi CBD)"
                value={deliveryLocationSearch}
                onChange={(e) => setDeliveryLocationSearch(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Office selection dropdown */}
            {destinationOffices.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Select destination office:
                </Label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {destinationOffices.map((office) => {
                    const isSelected = selectedDestinationOffice === office.id
                    return (
                      <button
                        key={office.id}
                        type="button"
                        onClick={() => setSelectedDestinationOffice(office.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all duration-200 relative",
                          isSelected
                            ? "bg-foreground text-background border-foreground shadow-md"
                            : "bg-background hover:bg-muted border-border"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {office.office_name}
                              {isSelected && (
                                <CheckIcon className="h-4 w-4 text-background" />
                              )}
                            </div>
                            <div className={cn("text-xs mt-1", isSelected ? "opacity-90" : "opacity-80")}>
                              {office.address}
                            </div>
                            {office.distance_km && (
                              <div className={cn("text-xs mt-1", isSelected ? "opacity-80" : "opacity-60")}>
                                {office.distance_km.toFixed(2)} km away
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {deliveryLocationSearch.length >= 3 &&
              !isSearching &&
              destinationOffices.length === 0 && (
                <p className="text-xs text-muted-foreground">No offices found</p>
              )}
          </div>

          {/* Selected Office Display */}
          {selectedDestinationOffice && selectedDestinationOfficeData && (
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Selected: {selectedDestinationOfficeData.office_name}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!selectedDestinationOffice}
              className="w-full h-12 rounded-xl bg-green-600 text-background font-medium disabled:opacity-50"
            >
              Add Parcel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
