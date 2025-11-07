"use client"

import * as React from "react"

interface LeafletMapProps {
  className?: string
  height?: number
  center: [number, number]
  zoom?: number
  route?: Array<[number, number]>
  origin?: [number, number]
  destination?: [number, number]
}

// Lightweight Leaflet loader using CDN (no npm dependency)
export function LeafletMap({ className, height = 260, center, zoom = 13, route, origin, destination }: LeafletMapProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null)
  const instanceRef = React.useRef<any>(null)
  const polylineRef = React.useRef<any>(null)
  const markersRef = React.useRef<any[]>([])

  // Initialize map (only once or when origin/destination change)
  React.useEffect(() => {
    let isMounted = true

    async function ensureLeaflet() {
      if (typeof window === "undefined") return null
      // Load CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }
      // Load JS
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.async = true
          script.onload = () => resolve()
          document.body.appendChild(script)
        })
      }
      return (window as any).L
    }

    ensureLeaflet().then((L) => {
      if (!isMounted || !L || !mapRef.current) return
      
      // Only create map if it doesn't exist
      if (!instanceRef.current) {
        const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom)
        instanceRef.current = map

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)
      } else {
        // Map already exists, just update view if needed
        instanceRef.current.setView(center, zoom)
      }

      const map = instanceRef.current
      
      // Remove existing markers (if any)
      markersRef.current.forEach((marker) => {
        map.removeLayer(marker)
      })
      markersRef.current = []

      const markerPositions: any[] = []
      
      if (origin) {
        const originMarker = L.circleMarker(origin, { radius: 8, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.9, weight: 2 })
        originMarker.addTo(map)
        markersRef.current.push(originMarker)
        markerPositions.push(origin)
      }
      if (destination) {
        const destMarker = L.circleMarker(destination, { radius: 8, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.9, weight: 2 })
        destMarker.addTo(map)
        markersRef.current.push(destMarker)
        markerPositions.push(destination)
      }
      
      // Fit bounds to show markers
      if (markerPositions.length === 2) {
        const bounds = L.latLngBounds(markerPositions)
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    })

    return () => {
      isMounted = false
    }
  }, [center[0], center[1], origin?.[0], origin?.[1], destination?.[0], destination?.[1]])

  // Update route polyline when route changes (without recreating map)
  React.useEffect(() => {
    if (!instanceRef.current || !route || route.length < 2) return
    
    const L = (window as any).L
    if (!L) return

    try {
      const map = instanceRef.current

      // Ensure map is fully initialized and has required methods
      if (!map || typeof map.addLayer !== "function" || typeof map.removeLayer !== "function") {
        console.warn("[LeafletMap] Map not ready, skipping polyline")
        return
      }

      // Check if map has a valid container (map might not be fully initialized)
      if (!map.getContainer || !map.getContainer()) {
        console.warn("[LeafletMap] Map container not ready, skipping polyline")
        return
      }

      // Validate and filter route coordinates
      const validRoute = route.filter((coord) => {
        if (!Array.isArray(coord) || coord.length !== 2) return false
        const [lat, lng] = coord
        return (
          typeof lat === "number" &&
          typeof lng === "number" &&
          !isNaN(lat) &&
          !isNaN(lng) &&
          isFinite(lat) &&
          isFinite(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        )
      })

      if (validRoute.length < 2) {
        console.warn("[LeafletMap] Invalid route coordinates, skipping polyline")
        return
      }

      // Remove existing polyline if any
      if (polylineRef.current) {
        try {
          map.removeLayer(polylineRef.current)
        } catch (e) {
          // Ignore errors when removing layer
        }
        polylineRef.current = null
      }

      // Add new polyline with error handling
      try {
        const poly = L.polyline(validRoute, { color: "#3b82f6", weight: 4, opacity: 0.9 })
        poly.addTo(map)
        polylineRef.current = poly

        // Fit bounds to show route (with error handling)
        try {
          const bounds = poly.getBounds()
          if (bounds && bounds.isValid && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] })
          }
        } catch (boundsError) {
          console.warn("[LeafletMap] Failed to fit bounds:", boundsError)
          // Fallback: just center on first coordinate
          if (validRoute.length > 0) {
            map.setView(validRoute[0], map.getZoom() || 13)
          }
        }
      } catch (addError) {
        console.error("[LeafletMap] Failed to add polyline to map:", addError)
        return
      }
    } catch (error) {
      console.error("[LeafletMap] Error adding polyline:", error)
      // Clean up on error
      if (polylineRef.current) {
        try {
          instanceRef.current?.removeLayer(polylineRef.current)
        } catch (e) {
          // Ignore cleanup errors
        }
        polylineRef.current = null
      }
    }
  }, [route])

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
      polylineRef.current = null
    }
  }, [])

  return (
    <div className={className} style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />
    </div>
  )
}

export default LeafletMap


