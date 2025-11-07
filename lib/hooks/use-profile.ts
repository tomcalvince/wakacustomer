import useSWR from "swr"
import { useSession } from "next-auth/react"
import { fetchUserProfile } from "@/lib/services/user"
import type { UserProfile } from "@/lib/services/user"

/**
 * SWR fetcher function for user profile
 */
async function profileFetcher(
  url: string,
  accessToken: string,
  refreshToken: string,
  onTokenUpdate: (accessToken: string, refreshToken: string) => Promise<void>
): Promise<UserProfile | null> {
  return fetchUserProfile({
    accessToken,
    refreshToken,
    onTokenUpdate,
  })
}

/**
 * Hook to fetch user profile using SWR
 */
export function useProfile() {
  const { data: session, update: updateSession } = useSession()
  
  const { data, error, isLoading, mutate } = useSWR(
    session?.accessToken && session?.refreshToken
      ? ["profile", session.accessToken, session.refreshToken]
      : null,
    ([, accessToken, refreshToken]) =>
      profileFetcher("profile", accessToken, refreshToken, async (newAccessToken, newRefreshToken) => {
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
    profile: data,
    isLoading,
    isError: error,
    mutate,
  }
}

