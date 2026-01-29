import { LoginForm } from '@/components/auth/login-form'
import { getUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const user = await getUser()
  if (user) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const message = params.message

  return (
    <div className="w-full max-w-md space-y-4">
      {message && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 text-center">
          {message}
        </div>
      )}
      <LoginForm />
    </div>
  )
}
