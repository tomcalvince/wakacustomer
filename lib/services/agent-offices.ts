import { INTERNAL_API_URLS } from "@/lib/constants"
import { parseApiResponse } from "@/lib/utils/parse-api-response"

export interface RouteDestination {
  id?: string
  name: string
  code?: string
  [key: string]: any
}

export interface RouteFare {
  min_fare?: number
  max_fare?: number
  current_fare?: number
  [key: string]: any
}

export interface AgentOffice {
  id: string
  office_code: string
  office_name: string
  agent: string
  agent_name: string
  latitude: string
  longitude: string
  address: string
  city: string
  county: string
  region: string
  country: string
  phone: string
  email: string
  opening_hours: {
    [key: string]: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
  distance_km?: number
  // Routes and destinations (may be stringified JSON from API)
  destinations?: RouteDestination[] | string
  routes?: any
  // Fare information (may be stringified JSON or string numbers from API)
  fares?: RouteFare | string
  min_fare?: number | string
  max_fare?: number | string
  current_fare?: number | string
}

export interface FetchAgentOfficesParams {
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface SearchAgentOfficesParams {
  country: string
  location_name: string
  radius_km?: number
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface AgentOfficesResponse {
  count: number
  message: string
  offices: AgentOffice[]
}

/**
 * Fetches the authenticated user's own agent offices
 * @param params - Parameters including tokens and token update callback
 * @returns Array of agent offices or empty array on error
 */
export async function fetchAgentOffices(
  params: FetchAgentOfficesParams
): Promise<AgentOffice[]> {
  const { accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.AGENT_OFFICES

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.fetchAgentOffices] GET", url)
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.fetchAgentOffices] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[agent-offices.fetchAgentOffices] failed to parse error response",
            parseError
          )
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[agent-offices.fetchAgentOffices] error", errorData)
      }

      return []
    }

    const responseData: AgentOfficesResponse = await response.json()

    // Extract offices array from response
    let offices = responseData?.offices || []

    // Parse stringified JSON and convert numeric fields
    offices = parseApiResponse(offices, [
      "min_fare",
      "max_fare",
      "current_fare",
      "distance_km",
    ]) as AgentOffice[]

    // Ensure destinations, fares, and fare fields are properly parsed
    offices = offices.map((office) => {
      const parsed: AgentOffice = { ...office }

      // Parse destinations if it's a string
      if (parsed.destinations && typeof parsed.destinations === "string") {
        try {
          parsed.destinations = JSON.parse(parsed.destinations) as RouteDestination[]
        } catch {
          // If parsing fails, try to parse as part of the full object
          parsed.destinations = parseApiResponse(parsed.destinations) as RouteDestination[]
        }
      }

      // Parse fares if it's a string
      if (parsed.fares && typeof parsed.fares === "string") {
        try {
          parsed.fares = JSON.parse(parsed.fares) as RouteFare
        } catch {
          parsed.fares = parseApiResponse(parsed.fares) as RouteFare
        }
      }

      // Ensure fare fields are numbers
      if (typeof parsed.min_fare === "string") {
        parsed.min_fare = parseFloat(parsed.min_fare) || undefined
      }
      if (typeof parsed.max_fare === "string") {
        parsed.max_fare = parseFloat(parsed.max_fare) || undefined
      }
      if (typeof parsed.current_fare === "string") {
        parsed.current_fare = parseFloat(parsed.current_fare) || undefined
      }

      return parsed
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.fetchAgentOffices] success", { 
        count: responseData?.count ?? 0,
        officesCount: offices.length 
      })
    }

    return Array.isArray(offices) ? offices : []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[agent-offices.fetchAgentOffices] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return []
  }
}

/**
 * Searches for agent offices near a location
 * @param params - Parameters including location details, tokens, and token update callback
 * @returns Array of nearby agent offices or empty array on error
 */
export async function searchAgentOfficesByLocation(
  params: SearchAgentOfficesParams
): Promise<AgentOffice[]> {
  const { country, location_name, radius_km = 10, accessToken, refreshToken, onTokenUpdate } =
    params

  try {
    const url = INTERNAL_API_URLS.AGENT_OFFICES_NEARBY

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.searchAgentOfficesByLocation] POST", url)
      console.log("[agent-offices.searchAgentOfficesByLocation] payload", {
        country,
        location_name,
        radius_km,
      })
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        country,
        location_name,
        radius_km,
      }),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.searchAgentOfficesByLocation] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[agent-offices.searchAgentOfficesByLocation] failed to parse error response",
            parseError
          )
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[agent-offices.searchAgentOfficesByLocation] error", errorData)
      }

      return []
    }

    let data: AgentOffice[] = await response.json()

    // Parse stringified JSON and convert numeric fields
    data = parseApiResponse(data, [
      "min_fare",
      "max_fare",
      "current_fare",
      "distance_km",
    ]) as AgentOffice[]

    // Ensure destinations, fares, and fare fields are properly parsed
    data = data.map((office) => {
      const parsed: AgentOffice = { ...office }

      // Parse destinations if it's a string
      if (parsed.destinations && typeof parsed.destinations === "string") {
        try {
          parsed.destinations = JSON.parse(parsed.destinations) as RouteDestination[]
        } catch {
          parsed.destinations = parseApiResponse(parsed.destinations) as RouteDestination[]
        }
      }

      // Parse fares if it's a string
      if (parsed.fares && typeof parsed.fares === "string") {
        try {
          parsed.fares = JSON.parse(parsed.fares) as RouteFare
        } catch {
          parsed.fares = parseApiResponse(parsed.fares) as RouteFare
        }
      }

      // Ensure fare fields are numbers
      if (typeof parsed.min_fare === "string") {
        parsed.min_fare = parseFloat(parsed.min_fare) || undefined
      }
      if (typeof parsed.max_fare === "string") {
        parsed.max_fare = parseFloat(parsed.max_fare) || undefined
      }
      if (typeof parsed.current_fare === "string") {
        parsed.current_fare = parseFloat(parsed.current_fare) || undefined
      }

      return parsed
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.searchAgentOfficesByLocation] success", {
        count: data?.length ?? 0,
      })
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[agent-offices.searchAgentOfficesByLocation] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    return []
  }
}

export interface CreateAgentOfficeParams {
  office_name: string
  latitude: number
  longitude: number
  address: string
  city: string
  county: string
  country: string
  phone: string
  email: string
  opening_hours: {
    monday?: string
    tuesday?: string
    wednesday?: string
    thursday?: string
    friday?: string
    saturday?: string
    sunday?: string
  }
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

export interface UpdateAgentOfficeParams extends CreateAgentOfficeParams {
  officeId: string
}

export interface DeleteAgentOfficeParams {
  officeId: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Creates a new agent office
 * @param params - Parameters including office data, tokens, and token update callback
 * @returns Created agent office or null on error
 */
export async function createAgentOffice(
  params: CreateAgentOfficeParams
): Promise<AgentOffice | null> {
  const {
    office_name,
    latitude,
    longitude,
    address,
    city,
    county,
    country,
    phone,
    email,
    opening_hours,
    accessToken,
    refreshToken,
    onTokenUpdate,
  } = params

  try {
    const url = INTERNAL_API_URLS.AGENT_OFFICES

    const payload = {
      office_name,
      latitude,
      longitude,
      address,
      city,
      county,
      country,
      phone,
      email,
      opening_hours,
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.createAgentOffice] POST", url)
      console.log("[agent-offices.createAgentOffice] payload", {
        office_name,
        city,
        country,
      })
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.createAgentOffice] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[agent-offices.createAgentOffice] failed to parse error response",
            parseError
          )
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[agent-offices.createAgentOffice] error", errorData)
      }

      throw new Error(errorData.message || errorData.detail || "Failed to create office")
    }

    let data: AgentOffice = await response.json()

    // Parse stringified JSON and convert numeric fields
    data = parseApiResponse(data, [
      "min_fare",
      "max_fare",
      "current_fare",
      "distance_km",
    ]) as AgentOffice

    // Ensure destinations, fares, and fare fields are properly parsed
    if (data) {
      // Parse destinations if it's a string
      if (data.destinations && typeof data.destinations === "string") {
        try {
          data.destinations = JSON.parse(data.destinations) as RouteDestination[]
        } catch {
          data.destinations = parseApiResponse(data.destinations) as RouteDestination[]
        }
      }

      // Parse fares if it's a string
      if (data.fares && typeof data.fares === "string") {
        try {
          data.fares = JSON.parse(data.fares) as RouteFare
        } catch {
          data.fares = parseApiResponse(data.fares) as RouteFare
        }
      }

      // Ensure fare fields are numbers
      if (typeof data.min_fare === "string") {
        data.min_fare = parseFloat(data.min_fare) || undefined
      }
      if (typeof data.max_fare === "string") {
        data.max_fare = parseFloat(data.max_fare) || undefined
      }
      if (typeof data.current_fare === "string") {
        data.current_fare = parseFloat(data.current_fare) || undefined
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.createAgentOffice] success", { office_id: data?.id })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[agent-offices.createAgentOffice] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred while creating office.")
  }
}

/**
 * Updates an existing agent office
 * @param params - Parameters including officeId, office data, tokens, and token update callback
 * @returns Updated agent office or null on error
 */
export async function updateAgentOffice(
  params: UpdateAgentOfficeParams
): Promise<AgentOffice | null> {
  const {
    officeId,
    office_name,
    latitude,
    longitude,
    address,
    city,
    county,
    country,
    phone,
    email,
    opening_hours,
    accessToken,
    refreshToken,
    onTokenUpdate,
  } = params

  try {
    const url = `${INTERNAL_API_URLS.AGENT_OFFICES}/${officeId}`

    const payload = {
      office_name,
      latitude,
      longitude,
      address,
      city,
      county,
      country,
      phone,
      email,
      opening_hours,
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.updateAgentOffice] PUT", url)
      console.log("[agent-offices.updateAgentOffice] payload", {
        office_name,
        city,
        country,
      })
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.updateAgentOffice] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[agent-offices.updateAgentOffice] failed to parse error response",
            parseError
          )
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[agent-offices.updateAgentOffice] error", errorData)
      }

      throw new Error(errorData.message || errorData.detail || "Failed to update office")
    }

    let data: AgentOffice = await response.json()

    // Parse stringified JSON and convert numeric fields
    data = parseApiResponse(data, [
      "min_fare",
      "max_fare",
      "current_fare",
      "distance_km",
    ]) as AgentOffice

    // Ensure destinations, fares, and fare fields are properly parsed
    if (data) {
      // Parse destinations if it's a string
      if (data.destinations && typeof data.destinations === "string") {
        try {
          data.destinations = JSON.parse(data.destinations) as RouteDestination[]
        } catch {
          data.destinations = parseApiResponse(data.destinations) as RouteDestination[]
        }
      }

      // Parse fares if it's a string
      if (data.fares && typeof data.fares === "string") {
        try {
          data.fares = JSON.parse(data.fares) as RouteFare
        } catch {
          data.fares = parseApiResponse(data.fares) as RouteFare
        }
      }

      // Ensure fare fields are numbers
      if (typeof data.min_fare === "string") {
        data.min_fare = parseFloat(data.min_fare) || undefined
      }
      if (typeof data.max_fare === "string") {
        data.max_fare = parseFloat(data.max_fare) || undefined
      }
      if (typeof data.current_fare === "string") {
        data.current_fare = parseFloat(data.current_fare) || undefined
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.updateAgentOffice] success", { office_id: data?.id })
    }

    return data || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[agent-offices.updateAgentOffice] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred while updating office.")
  }
}

/**
 * Deletes an agent office
 * @param params - Parameters including officeId, tokens, and token update callback
 * @returns true if successful, false otherwise
 */
export async function deleteAgentOffice(params: DeleteAgentOfficeParams): Promise<boolean> {
  const { officeId, accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = `${INTERNAL_API_URLS.AGENT_OFFICES}/${officeId}`

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.deleteAgentOffice] DELETE", url)
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.deleteAgentOffice] status", response.status)
    }

    if (!response.ok) {
      let errorData: any = {}
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        }
      } catch (parseError) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[agent-offices.deleteAgentOffice] failed to parse error response",
            parseError
          )
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[agent-offices.deleteAgentOffice] error", errorData)
      }

      throw new Error(errorData.message || errorData.detail || "Failed to delete office")
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[agent-offices.deleteAgentOffice] success")
    }

    return true
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[agent-offices.deleteAgentOffice] exception", error)
    }
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred while deleting office.")
  }
}
