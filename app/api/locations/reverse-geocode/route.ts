import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { BASE_URL, API_URLS } from "@/lib/constants"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

// Increase route handler timeout to 60 seconds
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const url = `${BASE_URL}${API_URLS.REVERSE_GEOCODE}`

    // Log request payload
    console.log("[api/locations/reverse-geocode] POST Request:", {
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
      console.log("[api/locations/reverse-geocode] POST Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/locations/reverse-geocode] POST Response:", {
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
    console.error("[api/locations/reverse-geocode] error", error)
    const message = error instanceof Error ? error.message : "Upstream request failed"
    return NextResponse.json({ detail: message }, { status: 502 })
  }
}

