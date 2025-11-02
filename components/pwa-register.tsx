"use client"

import * as React from "react"

export function PWARegister() {
  React.useEffect(() => {
    // Register service worker for PWA installability
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Register immediately, don't wait for load event
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          if (process.env.NODE_ENV !== "production") {
            console.log("Service Worker registered:", registration.scope)
          }
          // Update service worker if available
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                  if (process.env.NODE_ENV !== "production") {
                    console.log("Service Worker activated")
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })
    }
  }, [])

  return null
}

