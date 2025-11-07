import { INTERNAL_API_URLS } from "@/lib/constants"
import { Wallet, WalletListResponse, Transaction } from "@/types/wallet"

export interface FetchWalletParams {
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches wallet data from the API
 * @param params - Parameters including tokens and token update callback
 * @returns Wallet object (first from results) or null on error
 * @throws Error if token refresh fails
 */
export async function fetchWallet(params: FetchWalletParams): Promise<Wallet | null> {
  const { accessToken, refreshToken, onTokenUpdate } = params

  try {
    const url = INTERNAL_API_URLS.WALLET

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWallet] GET", url)
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWallet] status", response.status)
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
          console.error("[wallet.fetchWallet] failed to parse error response", parseError)
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        const logData: any = {
          url,
          status: response?.status ?? "unknown",
          statusText: response?.statusText ?? "unknown",
        }
        
        if (Object.keys(errorData).length > 0) {
          logData.errorData = errorData
        }
        
        if (errorText) {
          logData.errorText = errorText.substring(0, 500) // Limit length
        }
        
        // Only log if we have meaningful data
        if (logData.status !== "unknown" || logData.errorData || logData.errorText) {
          console.error("[wallet.fetchWallet] error", logData)
        }
      }

      // Return null on error instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWallet] success", {
        hasWallet: !!data,
        balance: data?.balance,
        currency: data?.currency,
      })
    }

    // API returns wallet object directly (not a list with results)
    // Check if it's a wallet object or a list response
    if (data && typeof data === "object") {
      // If it has 'results' array, it's a list response
      if (Array.isArray(data.results)) {
        return data.results[0] || null
      }
      // If it has wallet fields (balance, currency, etc.), it's a direct wallet object
      if (data.balance !== undefined || data.currency !== undefined) {
        return data as Wallet
      }
    }

    return null
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      const errorInfo: any = {
        message: error?.message || "Unknown error",
        name: error?.name || "Error",
      }
      
      if (error?.code) {
        errorInfo.code = error.code
      }
      
      if (error?.cause) {
        errorInfo.cause = error.cause
      }
      
      if (error?.stack) {
        errorInfo.stack = error.stack
      }
      
      console.error("[wallet.fetchWallet] exception", errorInfo)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return null on other errors
    return null
  }
}

export interface FetchWalletTransactionsParams {
  walletId: string | null
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches wallet transactions from the API
 * @param params - Parameters including walletId (optional), tokens, and token update callback
 * @returns Array of transactions or empty array on error
 * @throws Error if token refresh fails
 */
export async function fetchWalletTransactions(
  params: FetchWalletTransactionsParams
): Promise<Transaction[]> {
  const { walletId, accessToken, refreshToken, onTokenUpdate } = params
  // Only add walletId to URL if provided - backend may infer from session
  const url = walletId 
    ? `${INTERNAL_API_URLS.WALLET_TRANSACTIONS}?walletId=${walletId}`
    : INTERNAL_API_URLS.WALLET_TRANSACTIONS

  try {

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWalletTransactions] GET", url)
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWalletTransactions] status", response.status)
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
          console.error(
            "[wallet.fetchWalletTransactions] failed to parse error response",
            parseError
          )
        }
        try {
          errorText = await response.text()
        } catch (textError) {
          // Ignore if we can't get text either
        }
      }

      if (process.env.NODE_ENV !== "production") {
        const logData: any = {
          url,
          status: response?.status ?? "unknown",
          statusText: response?.statusText ?? "unknown",
        }
        
        if (Object.keys(errorData).length > 0) {
          logData.errorData = errorData
        }
        
        if (errorText) {
          logData.errorText = errorText.substring(0, 500) // Limit length
        }
        
        // Only log if we have meaningful data
        if (logData.status !== "unknown" || logData.errorData || logData.errorText) {
          console.error("[wallet.fetchWalletTransactions] error", logData)
        }
      }

      // Return empty array on error instead of throwing (unless it's a token refresh failure)
      return []
    }

    const data = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWalletTransactions] success", {
        dataType: Array.isArray(data) ? "array" : typeof data,
        count: Array.isArray(data) ? data.length : data?.transactions?.length ?? data?.results?.length ?? data?.count ?? 0,
      })
    }

    // Handle different response structures
    if (Array.isArray(data)) {
      return data
    }
    
    // If response is an object with transactions array (most common structure)
    if (data && typeof data === "object" && Array.isArray(data.transactions)) {
      return data.transactions
    }

    // If response is an object with results array
    if (data && typeof data === "object" && Array.isArray(data.results)) {
      return data.results
    }

    // Default to empty array if structure is unexpected
    return []
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      const errorInfo: any = {
        url,
        message: error?.message || "Unknown error",
        name: error?.name || "Error",
      }
      
      if (error?.code) {
        errorInfo.code = error.code
      }
      
      if (error?.cause) {
        errorInfo.cause = error.cause
      }
      
      if (error?.stack) {
        errorInfo.stack = error.stack
      }
      
      console.error("[wallet.fetchWalletTransactions] exception", errorInfo)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return empty array on other errors
    return []
  }
}

