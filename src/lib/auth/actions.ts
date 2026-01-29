'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import type { AuthResponse } from './types'

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function login(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  const result = loginSchema.safeParse({ email, password })
  if (!result.success) {
    const error = result.error.errors[0]
    return {
      success: false,
      error: { message: error.message },
    }
  }

  const supabase = await createServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) {
    return {
      success: false,
      error: { message: error.message, code: error.code },
    }
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validate input
  const result = signupSchema.safeParse({ email, password, confirmPassword })
  if (!result.success) {
    const error = result.error.errors[0]
    return {
      success: false,
      error: { message: error.message },
    }
  }

  const supabase = await createServerClient()

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
    },
  })

  if (error) {
    return {
      success: false,
      error: { message: error.message, code: error.code },
    }
  }

  return {
    success: true,
    redirectTo: '/login?message=Check your email to confirm your account',
  }
}

export async function logout(): Promise<void> {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
