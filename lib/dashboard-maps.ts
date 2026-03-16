import { readFileSync } from 'fs'
import { join } from 'path'
import Papa from 'papaparse'

export type TerritoryKey = 'New York' | 'DMV' | 'Other'

export function parseTerritoryFromGroup(group: string): TerritoryKey {
  if (!group || typeof group !== 'string') return 'Other'
  const g = group.toLowerCase()
  if (g.includes('northeast')) return 'New York'
  if (g.includes('dmv')) return 'DMV'
  return 'Other'
}

export function buildPlateMap(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const path = join(process.cwd(), 'reginfo.csv')
    const content = readFileSync(path, 'utf-8')
    const parsed = Papa.parse<Record<string, string>>(content, { header: true })
    for (const row of parsed.data) {
      const name = row['Vehicle Name']
      const plate = row['Vehicle License Plate']
      if (!name || plate == null || String(plate).trim() === '') continue
      const match = name.match(/z\d+/i)
      const code = match ? match[0].toLowerCase() : name.trim().toLowerCase()
      if (!code) continue
      const formatted = String(plate)
        .trim()
        .replace(/\s*\/\/\s*/g, ' / ')
        .replace(/\s+/g, ' ')
      out[code] = formatted
    }
  } catch {
    // reginfo.csv missing or unreadable
  }
  return out
}

export function buildTerritoryMap(): Record<string, TerritoryKey> {
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
