import { UserNav } from './user-nav'
import type { AuthUser } from '@/lib/auth/types'

interface HeaderProps {
  user: AuthUser
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-white">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-slate-900">
            Welcome back!
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
}
