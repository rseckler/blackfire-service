import { createClient } from '@/lib/supabase/server'
import type { AuthUser } from './types'

export async function getSession() {
  const supabase = await createClient()

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

export async function getUser(): Promise<AuthUser | null> {
  const session = await getSession()
  return session?.user ?? null
}
