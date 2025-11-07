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

    const url = `${BASE_URL}${API_URLS.AGENT_OFFICES}`

    if (process.env.NODE_ENV !== "production") {
      console.log("[api/agent-offices] GET", url)
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
      60000
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    try {
      const responseData = contentType.includes("application/json") ? JSON.parse(responseBody) : responseBody
      console.log("[api/agent-offices] GET Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/agent-offices] GET Response:", {
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
    console.error("[api/agent-offices] error", error)
    const message = error instanceof Error ? error.message : "Upstream request failed"
    return NextResponse.json({ detail: message }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const url = `${BASE_URL}${API_URLS.AGENT_OFFICES}`

    // Log request payload
    console.log("[api/agent-offices] POST Request:", {
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
      60000
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    try {
      const responseData = contentType.includes("application/json") ? JSON.parse(responseBody) : responseBody
      console.log("[api/agent-offices] POST Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/agent-offices] POST Response:", {
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
    console.error("[api/agent-offices] error", error)
    const message = error instanceof Error ? error.message : "Upstream request failed"
    return NextResponse.json({ detail: message }, { status: 502 })
  }
}

