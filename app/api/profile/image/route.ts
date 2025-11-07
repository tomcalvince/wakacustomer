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

    const url = `${BASE_URL}${API_URLS.PROFILE_IMAGE}`

    if (process.env.NODE_ENV !== "production") {
      console.log("[api/profile/image] GET", url)
    }

    const response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
      60000
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    if (contentType.includes("image")) {
      console.log("[api/profile/image] GET Response:", {
        status: response.status,
        statusText: response.statusText,
        contentType,
        bodySize: responseBody.length,
      })
    } else {
      try {
        const responseData = JSON.parse(responseBody)
        console.log("[api/profile/image] GET Response:", {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        })
      } catch (e) {
        console.log("[api/profile/image] GET Response:", {
          status: response.status,
          statusText: response.statusText,
          body: responseBody.substring(0, 500),
        })
      }
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    })
  } catch (error) {
    console.error("[api/profile/image] error", error)
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

    const formData = await req.formData()
    const url = `${BASE_URL}${API_URLS.PROFILE_IMAGE}`

    // Log request payload (formData info)
    const fileInfo: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        fileInfo[key] = {
          name: value.name,
          size: value.size,
          type: value.type,
        }
      } else {
        fileInfo[key] = value
      }
    }
    console.log("[api/profile/image] POST Request:", {
      url,
      payload: fileInfo,
    })

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      },
      60000
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    try {
      const responseData = JSON.parse(responseBody)
      console.log("[api/profile/image] POST Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/profile/image] POST Response:", {
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
    console.error("[api/profile/image] error", error)
    const message = error instanceof Error ? error.message : "Upstream request failed"
    return NextResponse.json({ detail: message }, { status: 502 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const url = `${BASE_URL}${API_URLS.PROFILE_IMAGE}`

    // Log request payload (formData info)
    const fileInfo: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        fileInfo[key] = {
          name: value.name,
          size: value.size,
          type: value.type,
        }
      } else {
        fileInfo[key] = value
      }
    }
    console.log("[api/profile/image] PUT Request:", {
      url,
      payload: fileInfo,
    })

    const response = await fetchWithTimeout(
      url,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      },
      60000
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    try {
      const responseData = JSON.parse(responseBody)
      console.log("[api/profile/image] PUT Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/profile/image] PUT Response:", {
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
    console.error("[api/profile/image] error", error)
    const message = error instanceof Error ? error.message : "Upstream request failed"
    return NextResponse.json({ detail: message }, { status: 502 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
    }

    const url = `${BASE_URL}${API_URLS.PROFILE_IMAGE}`

    if (process.env.NODE_ENV !== "production") {
      console.log("[api/profile/image] DELETE", url)
    }

    const response = await fetchWithTimeout(
      url,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
      60000
    )

    const responseBody = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"

    // Log response
    try {
      const responseData = JSON.parse(responseBody)
      console.log("[api/profile/image] DELETE Response:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })
    } catch (e) {
      console.log("[api/profile/image] DELETE Response:", {
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
    console.error("[api/profile/image] error", error)
    const message = error instanceof Error ? error.message : "Upstream request failed"
    return NextResponse.json({ detail: message }, { status: 502 })
  }
}

