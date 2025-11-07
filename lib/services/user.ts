import { INTERNAL_API_URLS } from "@/lib/constants"

export interface UserProfile {
  username: string
  email: string
  phone_number: string
  user_type: string
  is_verified: boolean
  profile: {
    preferred_contact: string
  }
  avatar: string | null
}

export interface FetchUserProfileParams {
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches the current user's profile from the API
 * @param params - Parameters including tokens and token update callback
 * @returns UserProfile object or null on error
 * @throws Error if token refresh fails
 */
export async function fetchUserProfile(
  params: FetchUserProfileParams
): Promise<UserProfile | null> {
  const { accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.ME

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.fetchUserProfile] GET", url)
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.fetchUserProfile] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ""
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[user.fetchUserProfile] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[user.fetchUserProfile] error", {
          status: response.status,
          statusText: response.statusText,
          errorData: Object.keys(errorData).length > 0 ? errorData : null,
          errorText: errorText || null,
        })
      }

      // Return null on error instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data: UserProfile = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.fetchUserProfile] success", {
        username: data?.username,
        email: data?.email,
      })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[user.fetchUserProfile] exception", error)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return null on other errors
    return null
  }
}

export interface UpdateUserProfileParams {
  username?: string
  phone_number?: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Updates the current user's profile
 * @param params - Parameters including username, phone_number, tokens, and token update callback
 * @returns Updated UserProfile object or null on error
 * @throws Error if token refresh fails
 */
export async function updateUserProfile(
  params: UpdateUserProfileParams
): Promise<UserProfile | null> {
  const { username, phone_number, accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.ME

    const payload: { username?: string; phone_number?: string } = {}
    if (username !== undefined) {
      payload.username = username
    }
    if (phone_number !== undefined) {
      payload.phone_number = phone_number
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.updateUserProfile] PATCH", url)
      console.log("[user.updateUserProfile] payload", payload)
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.updateUserProfile] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ""
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[user.updateUserProfile] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[user.updateUserProfile] error", {
          status: response.status,
          statusText: response.statusText,
          errorData: Object.keys(errorData).length > 0 ? errorData : null,
          errorText: errorText || null,
        })
      }

      return null
    }

    const data: UserProfile = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.updateUserProfile] success", {
        username: data?.username,
        phone_number: data?.phone_number,
      })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[user.updateUserProfile] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return null
  }
}

export interface ProfileImageResponse {
  image_url: string
  message: string
}

export interface ProfileImageError {
  detail: string
}

export interface FetchProfileImageParams {
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches the current user's profile image
 * @param params - Parameters including tokens and token update callback
 * @returns ProfileImageResponse with image_url or null if no image exists
 * @throws Error if token refresh fails
 */
export async function fetchProfileImage(
  params: FetchProfileImageParams
): Promise<ProfileImageResponse | null> {
  const { accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.PROFILE_IMAGE

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.fetchProfileImage] GET", url)
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.fetchProfileImage] status", response.status)
    }

    if (!response.ok) {
      if (response.status === 404) {
        // No image exists - this is not an error
        return null
      }

      let errorData: any = {}
      let errorText = ""
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[user.fetchProfileImage] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[user.fetchProfileImage] error", {
          status: response.status,
          statusText: response.statusText,
          errorData: Object.keys(errorData).length > 0 ? errorData : null,
          errorText: errorText || null,
        })
      }

      return null
    }

    const data: ProfileImageResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.fetchProfileImage] success", {
        image_url: data?.image_url,
      })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[user.fetchProfileImage] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return null
  }
}

export interface UploadProfileImageParams {
  imageFile: File
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Uploads or updates the current user's profile image
 * @param params - Parameters including image file, tokens, and token update callback
 * @returns ProfileImageResponse with image_url or null on error
 * @throws Error if token refresh fails
 */
export async function uploadProfileImage(
  params: UploadProfileImageParams
): Promise<ProfileImageResponse | null> {
  const { imageFile, accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.PROFILE_IMAGE

    const formData = new FormData()
    formData.append("image", imageFile)

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.uploadProfileImage] POST", url)
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.uploadProfileImage] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ""
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[user.uploadProfileImage] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[user.uploadProfileImage] error", {
          status: response.status,
          statusText: response.statusText,
          errorData: Object.keys(errorData).length > 0 ? errorData : null,
          errorText: errorText || null,
        })
      }

      return null
    }

    const data: ProfileImageResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.uploadProfileImage] success", {
        image_url: data?.image_url,
      })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[user.uploadProfileImage] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return null
  }
}

/**
 * Updates the current user's profile image (same as upload but uses PUT)
 * @param params - Parameters including image file, tokens, and token update callback
 * @returns ProfileImageResponse with image_url or null on error
 * @throws Error if token refresh fails
 */
export async function updateProfileImage(
  params: UploadProfileImageParams
): Promise<ProfileImageResponse | null> {
  const { imageFile, accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.PROFILE_IMAGE

    const formData = new FormData()
    formData.append("image", imageFile)

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.updateProfileImage] PUT", url)
    }

    const response = await fetch(url, {
      method: "PUT",
      body: formData,
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.updateProfileImage] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      let errorText = ""
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[user.updateProfileImage] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[user.updateProfileImage] error", {
          status: response.status,
          statusText: response.statusText,
          errorData: Object.keys(errorData).length > 0 ? errorData : null,
          errorText: errorText || null,
        })
      }

      return null
    }

    const data: ProfileImageResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.updateProfileImage] success", {
        image_url: data?.image_url,
      })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[user.updateProfileImage] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return null
  }
}

export interface DeleteProfileImageParams {
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface DeleteProfileImageResponse {
  message: string
}

/**
 * Deletes the current user's profile image
 * @param params - Parameters including tokens and token update callback
 * @returns DeleteProfileImageResponse with message or null on error
 * @throws Error if token refresh fails
 */
export async function deleteProfileImage(
  params: DeleteProfileImageParams
): Promise<DeleteProfileImageResponse | null> {
  const { accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.PROFILE_IMAGE

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.deleteProfileImage] DELETE", url)
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.deleteProfileImage] status", response.status)
    }

    if (!response.ok) {
      if (response.status === 404) {
        // No image exists - this is not an error, just return null
        return null
      }

      let errorData: any = {}
      let errorText = ""
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        } else {
          errorText = await response.text()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[user.deleteProfileImage] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[user.deleteProfileImage] error", {
          status: response.status,
          statusText: response.statusText,
          errorData: Object.keys(errorData).length > 0 ? errorData : null,
          errorText: errorText || null,
        })
      }

      return null
    }

    const data: DeleteProfileImageResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[user.deleteProfileImage] success", {
        message: data?.message,
      })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[user.deleteProfileImage] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return null
  }
}

