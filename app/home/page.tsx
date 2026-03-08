import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { readFileSync } from 'fs'
import { join } from 'path'
import Papa from 'papaparse'
import HomeDashboardClient from './HomeDashboardClient'
import Navbar from '@/components/Navbar'
import TabSlideTransition from '@/components/TabSlideTransition'

export type TerritoryKey = 'New York' | 'DMV' | 'Other'

function parseTerritoryFromGroup(group: string): TerritoryKey {
  if (!group || typeof group !== 'string') return 'Other'
  const g = group.toLowerCase()
  if (g.includes('northeast')) return 'New York'
  if (g.includes('dmv')) return 'DMV'
  return 'Other'
}

function buildTerritoryMap(): Record<string, TerritoryKey> {
  const out: Record<string, TerritoryKey> = {}
  const files = ['reginfo.csv', 'fleetio-service-reminder-export-2026-02-19.csv']
  for (const file of files) {
    try {
      const path = join(process.cwd(), file)
      const content = readFileSync(path, 'utf-8')
      const parsed = Papa.parse<Record<string, string>>(content, { header: true })
      for (const row of parsed.data) {
        const name = row['Vehicle Name']
        const group = row['Vehicle Group']
        if (!name) continue
        const match = name.match(/z\d+/i)
        const code = match ? match[0].toLowerCase() : name.trim().toLowerCase()
        if (!code) continue
        out[code] = parseTerritoryFromGroup(group)
      }
    } catch {
      // file missing or unreadable
    }
  }
  return out
}

export default async function HomeDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const territoryMap = buildTerritoryMap()
  const companyId = user.user_metadata?.company_id as string | undefined

  return (
    <>
      <Navbar />
      <TabSlideTransition>
        <HomeDashboardClient territoryMap={territoryMap} companyId={companyId} />
      </TabSlideTransition>
    </>
  )
}
