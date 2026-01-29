import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper to get user from request
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')

  // Create client with ANON key to verify token
  const authClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data: { user }, error } = await authClient.auth.getUser()
  if (error || !user) return null

  // Create service role client for RLS bypass
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  return { user, supabase }
}

// GET /api/watchlist - Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    const result = await getUserFromRequest(request)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, supabase } = result

    // Get watchlist with company details
    const { data, error } = await supabase
      .from('watchlist')
      .select(`
        id,
        company_id,
        added_at,
        notes,
        companies (
          id,
          name,
          symbol,
          wkn,
          isin,
          current_price,
          extra_data
        )
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching watchlist:', error)
      return NextResponse.json(
        { error: 'Failed to fetch watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ watchlist: data })
  } catch (error) {
    console.error('Error in watchlist API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/watchlist - Add to watchlist
export async function POST(request: NextRequest) {
  try {
    const result = await getUserFromRequest(request)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, supabase } = result
    const body = await request.json()
    const { company_id, notes } = body

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    // Add to watchlist
    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        company_id,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      // Check for duplicate
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Company already in watchlist' },
          { status: 409 }
        )
      }

      console.error('Error adding to watchlist:', error)
      return NextResponse.json(
        { error: 'Failed to add to watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ watchlist: data })
  } catch (error) {
    console.error('Error in watchlist API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/watchlist - Remove from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const result = await getUserFromRequest(request)
    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, supabase } = result
    const { searchParams } = new URL(request.url)
    const company_id = searchParams.get('company_id')

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      )
    }

    // Remove from watchlist
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('company_id', company_id)

    if (error) {
      console.error('Error removing from watchlist:', error)
      return NextResponse.json(
        { error: 'Failed to remove from watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in watchlist API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
