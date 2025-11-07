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
 */
async function transactionsFetcher(
  url: string,
  walletId: string,
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
 */
export function useWalletTransactions(walletId: string | null) {
  const { data: session, update: updateSession } = useSession()
  
  const { data, error, isLoading, mutate } = useSWR(
    session?.accessToken && session?.refreshToken && walletId
      ? ["wallet-transactions", walletId, session.accessToken, session.refreshToken]
      : null,
    ([, walletId, accessToken, refreshToken]) =>
      transactionsFetcher("wallet-transactions", walletId, accessToken, refreshToken, async (newAccessToken, newRefreshToken) => {
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

