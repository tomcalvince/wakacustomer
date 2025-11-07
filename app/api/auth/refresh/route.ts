import { NextRequest, NextResponse } from "next/server"
import { BASE_URL, API_URLS } from "@/lib/constants"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

// Increase route handler timeout to 60 seconds
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    if (process.env.NODE_ENV !== "production") {
      console.log("[api/auth/refresh] POST", `${BASE_URL}${API_URLS.REFRESH_TOKEN}`)
    }

    const response = await fetchWithTimeout(
      `${BASE_URL}${API_URLS.REFRESH_TOKEN}`,
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

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    })
  } catch (error) {
    console.error("[api/auth/refresh] error", error)
    const message = error instanceof Error ? error.message : "Upstream request failed"
    return NextResponse.json({ detail: message }, { status: 502 })
  }
}

