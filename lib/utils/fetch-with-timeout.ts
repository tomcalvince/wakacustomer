import axios, { AxiosRequestConfig, AxiosError } from "axios"

/**
 * Creates a fetch request with a timeout using axios
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 60000 = 60 seconds)
 * @returns Promise<Response>
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 60000
): Promise<Response> {
  try {
    const axiosConfig: AxiosRequestConfig = {
      url,
      method: (options.method as any) || "GET",
      headers: options.headers as any,
      timeout: timeoutMs,
      validateStatus: () => true, // Don't throw on any status code
    }

    // Handle body
    if (options.body) {
      if (options.body instanceof FormData) {
        axiosConfig.data = options.body
        // Don't set Content-Type for FormData, let axios set it with boundary
        if (axiosConfig.headers) {
          delete (axiosConfig.headers as any)["Content-Type"]
        }
      } else if (typeof options.body === "string") {
        try {
          // Try to parse as JSON
          axiosConfig.data = JSON.parse(options.body)
          if (axiosConfig.headers && !(axiosConfig.headers as any)["Content-Type"]) {
            ;(axiosConfig.headers as any)["Content-Type"] = "application/json"
          }
        } catch {
          // If not JSON, use as-is
          axiosConfig.data = options.body
        }
      } else {
        axiosConfig.data = options.body
      }
    }

    const response = await axios(axiosConfig)

    // Convert axios response to fetch Response
    const responseBody = typeof response.data === "string" 
      ? response.data 
      : JSON.stringify(response.data)

    // Get content type from response
    const contentType = response.headers["content-type"] || 
                       response.headers["Content-Type"] || 
                       "application/json"

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type": contentType,
        ...Object.keys(response.headers).reduce((acc, key) => {
          const value = response.headers[key]
          if (value) {
            acc[key.toLowerCase()] = String(value)
          }
          return acc
        }, {} as Record<string, string>),
      },
    })
  } catch (error: any) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError

      // Handle timeout - check multiple ways axios reports timeouts
      if (
        axiosError.code === "ECONNABORTED" ||
        axiosError.code === "ETIMEDOUT" ||
        axiosError.message?.includes("timeout") ||
        error.code === "ETIMEDOUT" ||
        (error.cause && typeof error.cause === "object" && "code" in error.cause && error.cause.code === "ETIMEDOUT")
      ) {
        const timeoutError = new Error("ETIMEDOUT")
        timeoutError.cause = { code: "ETIMEDOUT" }
        throw timeoutError
      }

      // Handle network errors
      if (axiosError.code === "ECONNREFUSED" || axiosError.code === "ENOTFOUND") {
        const networkError = new Error(axiosError.code)
        networkError.cause = { code: axiosError.code }
        throw networkError
      }

      // If there's a response, convert it to a Response object
      if (axiosError.response) {
        const responseBody = typeof axiosError.response.data === "string"
          ? axiosError.response.data
          : JSON.stringify(axiosError.response.data || {})

        const contentType = axiosError.response.headers["content-type"] ||
                           axiosError.response.headers["Content-Type"] ||
                           "application/json"

        return new Response(responseBody, {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText || "Error",
          headers: {
            "content-type": contentType,
          },
        })
      }
    }

    // Handle AggregateError with ETIMEDOUT
    if (error && typeof error === "object" && "code" in error && error.code === "ETIMEDOUT") {
      const timeoutError = new Error("ETIMEDOUT")
      timeoutError.cause = { code: "ETIMEDOUT" }
      throw timeoutError
    }

    // Re-throw other errors
    throw error
  }
}
