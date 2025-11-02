// Authentication related types

export interface LoginResponse {
  access: string
  refresh: string
  user: {
    username: string
    user_type: string
    is_verified: boolean
    is_active: boolean
  }
}

export interface AuthUser {
  id?: string
  username: string
  user_type: string
  is_verified: boolean
  is_active: boolean
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  phone_number: string
  user_type: "agent"
}

export interface RegisterResponse {
  username: string
  email: string
  phone_number: string
  user_type: string
  is_verified: boolean
  profile: {
    preferred_contact: string
  }
}
