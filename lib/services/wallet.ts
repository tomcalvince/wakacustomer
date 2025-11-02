import { getApiUrl, API_URLS } from "@/lib/constants"
import { Wallet, WalletListResponse, Transaction } from "@/types/wallet"
import { fetchWithAuth } from "./api-client"

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
    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWallet] GET", getApiUrl(API_URLS.WALLETS))
    }

    const url = getApiUrl(API_URLS.WALLETS)

    const response = await fetchWithAuth(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
      refreshToken,
      onTokenUpdate
    )

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWallet] status", response.status)
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
          console.error("[wallet.fetchWallet] failed to parse error response", parseError)
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[wallet.fetchWallet] error", errorData)
      }

      // Return null on error instead of throwing (unless it's a token refresh failure)
      return null
    }

    const data: WalletListResponse = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWallet] success", {
        count: data?.count ?? 0,
        walletsFound: data?.results?.length ?? 0,
      })
    }

    // Return first wallet from results, or null if no wallets
    return data?.results?.[0] || null
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[wallet.fetchWallet] exception", error)
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
  walletId: string
  accessToken: string
  refreshToken: string
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
}

/**
 * Fetches wallet transactions from the API
 * @param params - Parameters including walletId, tokens, and token update callback
 * @returns Array of transactions or empty array on error
 * @throws Error if token refresh fails
 */
export async function fetchWalletTransactions(
  params: FetchWalletTransactionsParams
): Promise<Transaction[]> {
  const { walletId, accessToken, refreshToken, onTokenUpdate } = params

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[wallet.fetchWalletTransactions] GET",
        `${getApiUrl(API_URLS.WALLET_TRANSACTIONS)}/${walletId}/transactions/`
      )
    }

    const url = `${getApiUrl(API_URLS.WALLET_TRANSACTIONS)}/${walletId}/transactions/`

    const response = await fetchWithAuth(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      accessToken,
      refreshToken,
      onTokenUpdate
    )

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWalletTransactions] status", response.status)
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
            "[wallet.fetchWalletTransactions] failed to parse error response",
            parseError
          )
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.error("[wallet.fetchWalletTransactions] error", errorData)
      }

      // Return empty array on error instead of throwing (unless it's a token refresh failure)
      return []
    }

    const data: Transaction[] = await response.json()

    if (process.env.NODE_ENV !== "production") {
      console.log("[wallet.fetchWalletTransactions] success", {
        count: data?.length ?? 0,
      })
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[wallet.fetchWalletTransactions] exception", error)
    }
    // If error is about token refresh failure, re-throw to trigger logout
    if (error instanceof Error && error.message.includes("Token refresh failed")) {
      throw error
    }
    // Return empty array on other errors
    return []
  }
}

