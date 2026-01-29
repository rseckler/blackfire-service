'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WatchlistButton } from '@/components/watchlist/watchlist-button'

interface Company {
  id: string
  name: string
  symbol: string | null
  wkn: string | null
  isin: string | null
  satellog: string
  current_price: number | null
  extra_data: Record<string, string | number | boolean | null>
  created_at: string
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCompany()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchCompany = async () => {
    try {
      const companyId = params.id as string

      if (!companyId) {
        throw new Error('Company ID is required')
      }

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (fetchError) throw fetchError

      setCompany(data)
    } catch (err) {
      console.error('Failed to fetch company:', err)
      setError('Company not found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-muted-foreground">Loading company...</div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center space-y-4">
        <div className="text-muted-foreground">{error || 'Company not found'}</div>
        <Button onClick={() => router.push('/stocks')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stocks
        </Button>
      </div>
    )
  }

  const ed = company.extra_data || {}

  const formatValue = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') return value.toLocaleString()
    if (typeof value === 'boolean') return value ? '✓' : '✗'
    return String(value)
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push('/stocks')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stocks
          </Button>
          <h1 className="mt-4 text-4xl font-bold">{company.name}</h1>
          <div className="mt-2 flex items-center space-x-4 text-muted-foreground">
            {company.symbol && <span>Symbol: {company.symbol}</span>}
            {ed.Ticker && <span>Ticker: {ed.Ticker}</span>}
            {ed.Exchange && <span>Exchange: {ed.Exchange}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end space-y-3">
          <WatchlistButton companyId={company.id} companyName={company.name} />
          {ed.Market_Status && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Market Status</div>
              <div className="text-lg font-semibold">{ed.Market_Status}</div>
            </div>
          )}
        </div>
      </div>

      {/* Price Card */}
      {ed.Current_Price && (
        <Card>
          <CardHeader>
            <CardTitle>Current Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <div className="text-sm text-muted-foreground">Price</div>
                <div className="text-3xl font-bold">
                  {formatValue(ed.Current_Price)} {ed.Currency}
                </div>
              </div>
              {typeof ed.Price_Change_Percent === 'number' && (
                <div>
                  <div className="text-sm text-muted-foreground">Change</div>
                  <div className={`text-2xl font-semibold ${ed.Price_Change_Percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ed.Price_Change_Percent > 0 ? '+' : ''}{formatValue(ed.Price_Change_Percent)}%
                  </div>
                </div>
              )}
              {ed.Day_High && (
                <div>
                  <div className="text-sm text-muted-foreground">Day High</div>
                  <div className="text-2xl font-semibold">{formatValue(ed.Day_High)}</div>
                </div>
              )}
              {ed.Day_Low && (
                <div>
                  <div className="text-sm text-muted-foreground">Day Low</div>
                  <div className="text-2xl font-semibold">{formatValue(ed.Day_Low)}</div>
                </div>
              )}
            </div>
            {ed.Price_Update && (
              <div className="mt-4 text-sm text-muted-foreground">
                Last updated: {new Date(ed.Price_Update).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile */}
      {ed.Profile && (
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{ed.Profile}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Identifiers */}
        <Card>
          <CardHeader>
            <CardTitle>Identifiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Symbol</span>
              <span className="font-medium">{company.symbol || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticker</span>
              <span className="font-medium">{formatValue(ed.Ticker)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">WKN</span>
              <span className="font-medium">{company.wkn || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">ISIN</span>
              <span className="font-medium">{company.isin || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Satellog ID</span>
              <span className="font-mono text-xs">{company.satellog}</span>
            </div>
          </CardContent>
        </Card>

        {/* Market Data */}
        <Card>
          <CardHeader>
            <CardTitle>Market Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volume</span>
              <span className="font-medium">{formatValue(ed.Volume)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market Cap</span>
              <span className="font-medium">{formatValue(ed.Market_Cap)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-medium">{formatValue(ed.Currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange</span>
              <span className="font-medium">{formatValue(ed.Exchange)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Industry</span>
              <span className="font-medium">{formatValue(ed.Industry)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thier</span>
              <span className="font-medium">{formatValue(ed.Thier)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thier Group</span>
              <span className="font-medium">{formatValue(ed.Thier_Group)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">VIP Status</span>
              <span className="font-medium">{formatValue(ed.VIP)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority Buy</span>
              <span className="font-medium">{formatValue(ed.Prio_Buy)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Leverage</span>
              <span className="font-medium">{formatValue(ed.Leverage)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ed.Info1 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Info 1</span>
                  <span className="font-medium">{ed.Info1}</span>
                </div>
                <Separator />
              </>
            )}
            {ed.Info2 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Info 2</span>
                  <span className="font-medium">{ed.Info2}</span>
                </div>
                <Separator />
              </>
            )}
            {ed.Info3 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Info 3</span>
                  <span className="font-medium">{ed.Info3}</span>
                </div>
                <Separator />
              </>
            )}
            {ed.Info5 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Info 5</span>
                  <span className="font-medium">{ed.Info5}</span>
                </div>
                <Separator />
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source</span>
              <span className="font-medium">{formatValue(ed.Source)}</span>
            </div>
            {ed['Purchase_$'] && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase $</span>
                  <span className="font-medium">${formatValue(ed['Purchase_$'])}</span>
                </div>
              </>
            )}
            {ed['Ranking alt'] && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ranking</span>
                  <span className="font-medium">{formatValue(ed['Ranking alt'])}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Colors */}
      {(ed.Background_color || ed.Font_color) && (
        <Card>
          <CardHeader>
            <CardTitle>UI Colors</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {ed.Background_color && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Background Color</div>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-16 h-16 rounded border-2"
                    style={{ backgroundColor: ed.Background_color }}
                  />
                  <span className="font-mono text-sm">{ed.Background_color}</span>
                </div>
              </div>
            )}
            {ed.Font_color && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Font Color</div>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-16 h-16 rounded border-2"
                    style={{ backgroundColor: ed.Font_color }}
                  />
                  <span className="font-mono text-sm">{ed.Font_color}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Added to Database</span>
            <span className="font-medium">{new Date(company.created_at).toLocaleString()}</span>
          </div>
          {ed['Date '] && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{formatValue(ed['Date '])}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
