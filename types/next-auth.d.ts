import "next-auth"
import { AuthUser } from "./auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    user: AuthUser
  }

  interface User extends AuthUser {
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    user?: AuthUser
  }
}
