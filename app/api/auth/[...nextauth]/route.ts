import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getInternalApiUrl, INTERNAL_API_URLS } from "@/lib/constants"
import { LoginResponse } from "@/types/auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          if (process.env.NODE_ENV !== "production") {
            console.log("[nextauth.authorize] credentials received", {
              email: credentials.email,
              passwordLength: credentials.password.length,
            })
          }
          const response = await fetch(getInternalApiUrl(INTERNAL_API_URLS.AUTH_LOGIN), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (process.env.NODE_ENV !== "production") {
            console.log("[nextauth.authorize] upstream status", response.status)
            console.log("[nextauth.authorize] upstream content-type", response.headers.get("content-type"))
          }

          // Check if response is JSON
          const contentType = response.headers.get("content-type")
          const isJson = contentType?.includes("application/json")

          if (!response.ok) {
            if (process.env.NODE_ENV !== "production") {
              if (isJson) {
                const body = await response.json().catch(() => ({}))
                console.log("[nextauth.authorize] upstream error body", body)
              } else {
                const textBody = await response.text()
                console.error("[nextauth.authorize] upstream non-JSON error", textBody.substring(0, 500))
              }
            }
            return null
          }

          if (!isJson) {
            if (process.env.NODE_ENV !== "production") {
              const textResponse = await response.text()
              console.error("[nextauth.authorize] upstream non-JSON success", textResponse.substring(0, 500))
            }
            return null
          }

          const data: LoginResponse = await response.json()
          if (process.env.NODE_ENV !== "production") {
            console.log("[nextauth.authorize] upstream success (truncated)", {
              hasAccess: Boolean(data?.access),
              hasRefresh: Boolean(data?.refresh),
              user: data?.user,
            })
          }

          // Check if user is verified and active
          if (!data.user.is_verified || !data.user.is_active) {
            if (process.env.NODE_ENV !== "production") {
              console.log("[nextauth.authorize] blocked due to status", data.user)
            }
            return null
          }

          // Check if user is an customer
          if (data.user.user_type !== "customer") {
            if (process.env.NODE_ENV !== "production") {
              console.log("[nextauth.authorize] blocked due to user_type", data.user.user_type)
            }
            return null
          }

          return {
            id: data.user.username, // Using username as id fallback
            username: data.user.username,
            user_type: data.user.user_type,
            is_verified: data.user.is_verified,
            is_active: data.user.is_active,
            accessToken: data.access,
            refreshToken: data.refresh,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - store tokens from user object
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.user = {
          username: user.username,
          user_type: user.user_type,
          is_verified: user.is_verified,
          is_active: user.is_active,
        }
      }

      // Handle session updates (triggered by session.update() from client)
      // This allows client-side token refresh to update the JWT token
      if (trigger === "update" && session) {
        if (session.accessToken) {
          token.accessToken = session.accessToken
        }
        if (session.refreshToken) {
          token.refreshToken = session.refreshToken
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken
        session.refreshToken = token.refreshToken
        session.user = {
          username: token.user?.username || "",
          user_type: token.user?.user_type || "",
          is_verified: token.user?.is_verified ?? false,
          is_active: token.user?.is_active ?? false,
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
