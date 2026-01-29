'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminPage() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    total?: number
    inserted?: number
    error?: string
    message?: string
  } | null>(null)

  const handleImport = async () => {
    setImporting(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/import-companies', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setResult({ error: data.error, message: data.message })
      }
    } catch (error) {
      setResult({
        error: 'Network error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Companies from Notion</CardTitle>
            <CardDescription>
              Import all companies from your Notion database to PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : 'Start Import'}
            </Button>

            {result && (
              <div className="mt-4 p-4 rounded-lg border">
                {result.success ? (
                  <div className="text-green-600">
                    <p className="font-semibold">✅ Import Successful!</p>
                    <p className="mt-2">Total companies: {result.total}</p>
                    <p>Inserted/Updated: {result.inserted}</p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <p className="font-semibold">❌ Import Failed</p>
                    <p className="mt-2">{result.error}</p>
                    {result.message && (
                      <p className="text-sm mt-1 text-gray-600">{result.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Info</CardTitle>
            <CardDescription>Current database statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Companies will be synced from Notion using the Satellog identifier
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
