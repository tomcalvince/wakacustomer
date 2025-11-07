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

    const url = new URL(`${BASE_URL}${API_URLS.CUSTOMER_ORDERS}`)
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value)
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[api/orders] GET", url.toString())
    }

    const response = await fetchWithTimeout(
      url.toString(),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
      60000 // 60 second timeout
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    try {
      const responseData = contentType.includes("application/json") ? JSON.parse(responseBody) : responseBody
      console.log("[api/orders] GET Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/orders] GET Response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody.substring(0, 500),
      })
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    })
  } catch (error) {
    console.error("[api/orders] GET error", error)
    
    // Handle specific error types
    let message = "Upstream request failed"
    let status = 502
    
    if (error instanceof Error) {
      // Check for timeout errors
      if (
        error.message.includes("ETIMEDOUT") ||
        error.message.includes("timeout") ||
        (error.cause && typeof error.cause === "object" && "code" in error.cause && error.cause.code === "ETIMEDOUT")
      ) {
        message = "ETIMEDOUT"
        status = 504 // Gateway Timeout
      } else if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
        message = "Unable to connect to the server"
        status = 503 // Service Unavailable
      } else {
        message = error.message
      }
    }
    
    return NextResponse.json({ detail: message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const url = `${BASE_URL}${API_URLS.MULTIRECIPIENT_ORDERS}`

    // Log request payload
    console.log("[api/orders] POST Request:", {
      url,
      payload: body,
    })

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(body),
      },
      60000 // 60 second timeout
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    try {
      const responseData = contentType.includes("application/json") ? JSON.parse(responseBody) : responseBody
      console.log("[api/orders] POST Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/orders] POST Response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody.substring(0, 500),
      })
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    })
  } catch (error) {
    console.error("[api/orders] POST error", error)
    
    // Handle specific error types
    let message = "Upstream request failed"
    let status = 502
    
    if (error instanceof Error) {
      // Check for timeout errors
      if (
        error.message.includes("ETIMEDOUT") ||
        error.message.includes("timeout") ||
        (error.cause && typeof error.cause === "object" && "code" in error.cause && error.cause.code === "ETIMEDOUT")
      ) {
        message = "ETIMEDOUT"
        status = 504 // Gateway Timeout
      } else if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
        message = "Unable to connect to the server"
        status = 503 // Service Unavailable
      } else {
        message = error.message
      }
    }
    
    return NextResponse.json({ detail: message }, { status })
  }
}

