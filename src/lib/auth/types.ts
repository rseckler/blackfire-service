import { User } from '@supabase/supabase-js'

export type AuthUser = User

export interface AuthSession {
  user: AuthUser
  expiresAt: number
}

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
  redirectTo?: string
}
