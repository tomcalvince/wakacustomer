import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { BASE_URL, API_URLS } from "@/lib/constants"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

// Increase route handler timeout to 60 seconds
export const maxDuration = 60

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const url = `${BASE_URL}${API_URLS.WALLETS}`

    if (process.env.NODE_ENV !== "production") {
      console.log("[api/wallet] GET", url)
    }

    const response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
      30000 // 30 second timeout
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    try {
      const responseData = contentType.includes("application/json") ? JSON.parse(responseBody) : responseBody
      console.log("[api/wallet] Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/wallet] Response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody.substring(0, 500), // Limit log size
      })
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    })
  } catch (error) {
    console.error("[api/wallet] error", error)
    
    // Handle specific error types
    let message = "Upstream request failed"
    let status = 502
    
    if (error instanceof Error) {
      // Check for timeout errors
      if (error.message.includes("ETIMEDOUT") || error.message.includes("timeout") || error.cause && typeof error.cause === "object" && "code" in error.cause && error.cause.code === "ETIMEDOUT") {
        message = "Request timeout - the server took too long to respond"
        status = 504
      } else if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
        message = "Unable to connect to the server"
        status = 503
      } else {
        message = error.message
      }
    }
    
    return NextResponse.json({ detail: message }, { status })
  }
}

