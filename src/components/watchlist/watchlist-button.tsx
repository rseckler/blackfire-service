'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WatchlistButtonProps {
  companyId: string
  companyName?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function WatchlistButton({
  companyId,
  companyName: _companyName,
  variant = 'outline',
  size = 'default',
}: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkWatchlistStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const checkWatchlistStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const response = await fetch('/api/watchlist', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      const data = await response.json()

      if (response.ok) {
        const inWatchlist = data.watchlist?.some(
          (item: { company_id: string }) => item.company_id === companyId
        )
        setIsInWatchlist(inWatchlist)
      }
    } catch (error) {
      console.error('Failed to check watchlist status:', error)
    }
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click when in table

    if (loading) return

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        alert('Please log in to manage your watchlist')
        setLoading(false)
        return
      }

      if (isInWatchlist) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlist?company_id=${companyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          setIsInWatchlist(false)
        } else {
          alert('Failed to remove from watchlist')
        }
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ company_id: companyId }),
        })

        if (response.ok) {
          setIsInWatchlist(true)
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to add to watchlist')
        }
      }
    } catch (error) {
      console.error('Failed to toggle watchlist:', error)
      alert('Failed to update watchlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={isInWatchlist ? 'text-yellow-500' : ''}
    >
      <Star className={`h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
      {size !== 'sm' && (
        <span className="ml-2">
          {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </span>
      )}
    </Button>
  )
}
