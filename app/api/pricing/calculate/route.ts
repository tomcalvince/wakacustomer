import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { BASE_URL, API_URLS } from "@/lib/constants"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const url = `${BASE_URL}${API_URLS.PRICING_CALCULATE}`

    if (process.env.NODE_ENV !== "production") {
      console.log("[api/pricing/calculate] POST Request:", {
        url,
        payload: body,
      })
    }

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

    try {
      const responseData = contentType.includes("application/json") ? JSON.parse(responseBody) : responseBody
      console.log("[api/pricing/calculate] POST Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/pricing/calculate] POST Response:", {
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
    console.error("[api/pricing/calculate] POST error", error)
    let message = "Upstream request failed"
    let status = 502

    if (error instanceof Error) {
      if (
        error.message.includes("ETIMEDOUT") ||
        error.message.includes("timeout") ||
        (error.cause && typeof error.cause === "object" && "code" in error.cause && error.cause.code === "ETIMEDOUT")
      ) {
        message = "ETIMEDOUT"
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

