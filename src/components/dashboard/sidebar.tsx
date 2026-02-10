'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Briefcase,
  Star,
  TrendingUp,
  FileText,
  Table2,
  Settings,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: Briefcase,
  },
  {
    name: 'Watchlist',
    href: '/watchlist',
    icon: Star,
  },
  {
    name: 'Stocks',
    href: '/stocks',
    icon: TrendingUp,
  },
  {
    name: 'Spreadsheet',
    href: '/spreadsheet',
    icon: Table2,
  },
  {
    name: 'Notes',
    href: '/notes',
    icon: FileText,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-slate-100">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
          <span className="text-xl font-bold">Blackfire</span>
        </Link>
      </div>

      <Separator className="bg-slate-800" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}

        <Separator className="my-4 bg-slate-800" />

        <Link
          href="/admin"
          className={cn(
            'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/admin'
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Admin</span>
        </Link>
      </nav>

      <div className="p-4">
        <div className="rounded-lg bg-slate-800 p-4">
          <p className="text-xs text-slate-400">
            Blackfire Service v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
