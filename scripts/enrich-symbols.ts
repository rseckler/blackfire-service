/**
 * Symbol Enrichment Script
 *
 * Usage:
 *   npm run enrich:symbols              - Enrich up to 50 companies
 *   npm run enrich:symbols -- --all     - Enrich all companies
 *   npm run enrich:symbols -- --limit 100
 */

import { getSymbolEnrichmentService } from '../src/lib/services/symbol-enrichment-service'

async function main() {
  const args = process.argv.slice(2)
  const allFlag = args.includes('--all')
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : 50

  console.log('🔍 Symbol Enrichment Service')
  console.log('============================')
  console.log(`Mode: ${allFlag ? 'ALL companies' : `Batch of ${limit}`}`)
  console.log('API: OpenFIGI (free tier: 250 requests/day)')
  console.log()

  const service = getSymbolEnrichmentService()

  if (allFlag) {
    // Process in batches of 50 to avoid overwhelming the API
    let totalEnriched = 0
    let totalFailed = 0
    let batch = 1

    while (true) {
      console.log(`\n📦 Batch ${batch}...`)
      const result = await service.enrichAllCompanies(50)

      totalEnriched += result.enriched
      totalFailed += result.failed

      // Stop if no more companies to process
      if (result.enriched === 0 && result.failed === 0) {
        console.log('\n✅ All companies processed!')
        break
      }

      batch++

      // Pause between batches
      console.log('⏸️  Pausing 30 seconds before next batch...')
      await new Promise((resolve) => setTimeout(resolve, 30000))
    }

    console.log('\n' + '='.repeat(50))
    console.log(`📊 Total Results:`)
    console.log(`   ✅ Enriched: ${totalEnriched}`)
    console.log(`   ❌ Failed: ${totalFailed}`)
  } else {
    const result = await service.enrichAllCompanies(limit)
    console.log('\n' + '='.repeat(50))
    console.log(`📊 Results:`)
    console.log(`   ✅ Enriched: ${result.enriched}`)
    console.log(`   ❌ Failed: ${result.failed}`)
  }

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Script error:', error)
  process.exit(1)
})
