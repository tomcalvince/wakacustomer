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
      // Ensure we wait for the full response and get clearer timeout errors
      transitional: {
        clarifyTimeoutError: true,
      },
      // Add connection timeout (separate from request timeout)
      // This helps catch connection issues early
      httpAgent: undefined, // Use default agent
      httpsAgent: undefined, // Use default agent
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
    // Log detailed error information for debugging
    if (process.env.NODE_ENV !== "production") {
      console.error("[fetchWithTimeout] Error details:", {
        url,
        timeoutMs,
        isAxiosError: axios.isAxiosError(error),
        code: error?.code,
        message: error?.message,
        cause: error?.cause,
        axiosCode: axios.isAxiosError(error) ? (error as AxiosError).code : undefined,
        axiosMessage: axios.isAxiosError(error) ? (error as AxiosError).message : undefined,
        response: axios.isAxiosError(error) && (error as AxiosError).response ? {
          status: (error as AxiosError).response?.status,
          statusText: (error as AxiosError).response?.statusText,
        } : undefined,
      })
    }

    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError

      // Check if this is actually a timeout error
      // ECONNABORTED can be from timeout OR manual abort, so we need to check the message
      // ETIMEDOUT is a system-level connection timeout (usually means connection couldn't be established)
      // We only want to treat ECONNABORTED as timeout if the message indicates it's a timeout
      const isTimeout = 
        (axiosError.code === "ECONNABORTED" && 
         (axiosError.message?.toLowerCase().includes("timeout") || 
          axiosError.message?.toLowerCase().includes("exceeded"))) ||
        axiosError.code === "ETIMEDOUT" ||
        (axiosError.message?.toLowerCase().includes("timeout") && 
         !axiosError.message?.toLowerCase().includes("connection") &&
         !axiosError.message?.toLowerCase().includes("refused"))

      // Handle timeout - only if we're confident it's actually a timeout
      if (
        isTimeout ||
        (error.code === "ETIMEDOUT") ||
        (error.cause && typeof error.cause === "object" && "code" in error.cause && error.cause.code === "ETIMEDOUT")
      ) {
        const timeoutError = new Error("ETIMEDOUT")
        timeoutError.cause = { code: "ETIMEDOUT" }
        throw timeoutError
      }
      
      // If we have ECONNABORTED but it's not clearly a timeout, log it but don't treat as timeout
      if (axiosError.code === "ECONNABORTED" && !isTimeout) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[fetchWithTimeout] Request aborted but not clearly a timeout:", axiosError.message)
        }
        // Treat as a generic network error instead of timeout
        const networkError = new Error("Request aborted")
        networkError.cause = { code: "ECONNABORTED" }
        throw networkError
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
