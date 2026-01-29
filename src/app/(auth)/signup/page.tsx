import { SignupForm } from '@/components/auth/signup-form'
import { getUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function SignupPage() {
  const user = await getUser()
  if (user) {
    redirect('/dashboard')
  }

  return <SignupForm />
}
