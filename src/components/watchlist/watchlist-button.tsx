'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'

interface WatchlistButtonProps {
  companyId: string
  companyName: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function WatchlistButton({
  companyId,
  companyName,
  variant = 'outline',
  size = 'default',
}: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkWatchlistStatus()
  }, [companyId])

  const checkWatchlistStatus = async () => {
    try {
      const response = await fetch('/api/watchlist')
      const data = await response.json()

      if (response.ok) {
        const inWatchlist = data.watchlist?.some(
          (item: any) => item.company_id === companyId
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
      if (isInWatchlist) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlist?company_id=${companyId}`, {
          method: 'DELETE',
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
          headers: { 'Content-Type': 'application/json' },
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
