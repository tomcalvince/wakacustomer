import { getApiUrl, API_URLS } from "@/lib/constants"
import { LoginResponse, AuthTokens, RegisterRequest, RegisterResponse } from "@/types/auth"

/**
 * Login service that authenticates user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns LoginResponse with tokens and user data
 * @throws Error if login fails or user is not verified/inactive
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    if (process.env.NODE_ENV !== "production") {
      // Log outgoing request (without password in plain text)
      console.log("[auth.login] POST", getApiUrl(API_URLS.LOGIN))
      console.log("[auth.login] payload", { email, passwordLength: password?.length ?? 0 })
    }
    const response = await fetch(getApiUrl(API_URLS.LOGIN), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[auth.login] status", response.status)
      console.log("[auth.login] content-type", response.headers.get("content-type"))
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    const isJson = contentType?.includes("application/json")

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ""
      
      try {
        if (isJson) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
          if (process.env.NODE_ENV !== "production") {
            console.error("[auth.login] non-JSON error response", errorText.substring(0, 500))
          }
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[auth.login] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("[auth.login] error body", errorData)
      }

      const errorMessage = errorData.message || errorData.detail || (errorText ? "Server returned an error page. Check API URL." : "Login failed. Please check your credentials.")
      throw new Error(errorMessage)
    }

    if (!isJson) {
      const textResponse = await response.text()
      if (process.env.NODE_ENV !== "production") {
        console.error("[auth.login] non-JSON success response", textResponse.substring(0, 500))
      }
      throw new Error("Server returned invalid response format. Expected JSON.")
    }

    const data: LoginResponse = await response.json()
    if (process.env.NODE_ENV !== "production") {
      console.log("[auth.login] success body (truncated)", {
        hasAccess: Boolean(data?.access),
        hasRefresh: Boolean(data?.refresh),
        user: data?.user,
      })
    }

    // Validate user status
    if (!data.user.is_verified) {
      throw new Error("Account not verified. Please verify your email.")
    }

    if (!data.user.is_active) {
      throw new Error("Account is inactive. Please contact support.")
    }

    // Check if user is an agent
    if (data.user.user_type !== "agent") {
      throw new Error("Only agents are allowed access.")
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth.login] exception", error)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred during login.")
  }
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - The refresh token
 * @returns New access and refresh tokens
 * @throws Error if refresh fails
 */
export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[auth.refreshToken] POST", getApiUrl(API_URLS.REFRESH_TOKEN))
    }

    const response = await fetch(getApiUrl(API_URLS.REFRESH_TOKEN), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[auth.refreshToken] status", response.status)
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    const isJson = contentType?.includes("application/json")

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ""

      try {
        if (isJson) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
          if (process.env.NODE_ENV !== "production") {
            console.error("[auth.refreshToken] non-JSON error response", errorText.substring(0, 500))
          }
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[auth.refreshToken] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[auth.refreshToken] error body", errorData)
      }

      const errorMessage = errorData.message || errorData.detail || (errorText ? "Token refresh failed." : "Token refresh failed. Please login again.")
      throw new Error(errorMessage)
    }

    if (!isJson) {
      const textResponse = await response.text()
      if (process.env.NODE_ENV !== "production") {
        console.error("[auth.refreshToken] non-JSON success response", textResponse.substring(0, 500))
      }
      throw new Error("Server returned invalid response format. Expected JSON.")
    }

    const data: AuthTokens = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[auth.refreshToken] success", {
        hasAccess: Boolean(data?.access),
        hasRefresh: Boolean(data?.refresh),
      })
    }

    if (!data.access || !data.refresh) {
      throw new Error("Invalid token response from server.")
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth.refreshToken] exception", error)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred during token refresh.")
  }
}

/**
 * Register a new user
 * @param data - Registration data including email, password, first_name, last_name, phone_number, user_type
 * @returns RegisterResponse with user data
 * @throws Error if registration fails
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[auth.register] POST", getApiUrl(API_URLS.REGISTER))
      console.log("[auth.register] payload", {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        user_type: data.user_type,
        passwordLength: data.password?.length ?? 0,
      })
    }

    const response = await fetch(getApiUrl(API_URLS.REGISTER), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[auth.register] status", response.status)
      console.log("[auth.register] content-type", response.headers.get("content-type"))
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type")
    const isJson = contentType?.includes("application/json")

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ""

      try {
        if (isJson) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
          if (process.env.NODE_ENV !== "production") {
            console.error("[auth.register] non-JSON error response", errorText.substring(0, 500))
          }
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[auth.register] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("[auth.register] error body", errorData)
      }

      const errorMessage =
        errorData.message ||
        errorData.detail ||
        (errorText ? "Server returned an error page. Check API URL." : "Registration failed. Please check your information.")
      throw new Error(errorMessage)
    }

    if (!isJson) {
      const textResponse = await response.text()
      if (process.env.NODE_ENV !== "production") {
        console.error("[auth.register] non-JSON success response", textResponse.substring(0, 500))
      }
      throw new Error("Server returned invalid response format. Expected JSON.")
    }

    const responseData: RegisterResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[auth.register] success body", {
        username: responseData?.username,
        email: responseData?.email,
        user_type: responseData?.user_type,
        is_verified: responseData?.is_verified,
      })
    }

    return responseData
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth.register] exception", error)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred during registration.")
  }
}
