import useSWR from "swr"
import { useSession } from "next-auth/react"
import { fetchWallet, fetchWalletTransactions } from "@/lib/services/wallet"
import type { Wallet, Transaction } from "@/types/wallet"

/**
 * SWR fetcher function for wallet data
 */
async function walletFetcher(
  url: string,
  accessToken: string,
  refreshToken: string,
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
): Promise<Wallet | null> {
  return fetchWallet({
    accessToken,
    refreshToken,
    onTokenUpdate,
  })
}

/**
 * SWR fetcher function for wallet transactions
 * Can fetch with or without walletId - backend may infer wallet from session
 */
async function transactionsFetcher(
  url: string,
  walletId: string | null,
  accessToken: string,
  refreshToken: string,
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
): Promise<Transaction[]> {
  return fetchWalletTransactions({
    walletId,
    accessToken,
    refreshToken,
    onTokenUpdate,
  })
}

/**
 * Hook to fetch wallet data using SWR
 */
export function useWallet() {
  const { data: session, update: updateSession } = useSession()
  
  const { data, error, isLoading, mutate } = useSWR(
    session?.accessToken && session?.refreshToken
      ? ["wallet", session.accessToken, session.refreshToken]
      : null,
    ([, accessToken, refreshToken]) =>
      walletFetcher("wallet", accessToken, refreshToken, async (newAccessToken, newRefreshToken) => {
        await updateSession({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    wallet: data,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook to fetch wallet transactions using SWR
 * Can fetch with or without walletId - backend may infer wallet from session
 */
export function useWalletTransactions(walletId: string | null) {
  const { data: session, update: updateSession } = useSession()
  
  // Allow fetching even without walletId - backend might infer from session
  const { data, error, isLoading, mutate } = useSWR(
    session?.accessToken && session?.refreshToken
      ? ["wallet-transactions", walletId || "default", session.accessToken, session.refreshToken]
      : null,
    ([, walletIdParam, accessToken, refreshToken]) =>
      transactionsFetcher("wallet-transactions", walletIdParam === "default" ? null : walletIdParam, accessToken, refreshToken, async (newAccessToken, newRefreshToken) => {
        await updateSession({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    transactions: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

