import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get sample of companies
    const { data, error } = await supabase
      .from('companies')
      .select('extra_data')
      .limit(100)

    if (error) throw error

    // Collect all unique keys
    const allKeys = new Set<string>()
    data?.forEach(company => {
      if (company.extra_data) {
        Object.keys(company.extra_data).forEach(key => allKeys.add(key))
      }
    })

    const sortedKeys = Array.from(allKeys).sort()

    return NextResponse.json({
      total: sortedKeys.length,
      fields: sortedKeys,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to check fields' },
      { status: 500 }
    )
  }
}
