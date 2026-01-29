import Link from 'next/link'
import { getUser } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const user = await getUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-center">
        <h1 className="mb-4 text-6xl font-bold">
          Blackfire <span className="text-primary">Service</span>
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Stock Investment Analysis Platform
        </p>
        <div className="flex gap-4 justify-center">
          {user ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/login">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
