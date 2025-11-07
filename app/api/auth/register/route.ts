import { NextRequest, NextResponse } from "next/server"
import { BASE_URL, API_URLS } from "@/lib/constants"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

// Increase route handler timeout to 60 seconds
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const url = `${BASE_URL}${API_URLS.REGISTER}`

    // Log request payload (excluding password for security)
    const logBody = { ...body }
    if (logBody.password) {
      logBody.password = "***REDACTED***"
    }
    console.log("[api/auth/register] POST Request:", {
      url,
      payload: logBody,
    })

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      60000
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    try {
      const responseData = contentType.includes("application/json") ? JSON.parse(responseBody) : responseBody
      console.log("[api/auth/register] POST Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/auth/register] POST Response:", {
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
    console.error("[api/auth/register] error", error)
    const message = error instanceof Error ? error.message : "Upstream request failed"
    return NextResponse.json({ detail: message }, { status: 502 })
  }
}

