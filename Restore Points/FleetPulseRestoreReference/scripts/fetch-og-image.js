/**
 * Fetches the live OG image and saves to public/og-image.png.
 * Run after deploy so iMessage gets a fast static file: node scripts/fetch-og-image.js
 * Then point layout og:image to /og-image.png and commit public/og-image.png.
 */
const https = require('https')
const fs = require('fs')
const path = require('path')

const url = process.env.OG_IMAGE_URL || 'https://FleetPulseHQ.com/og-image'
const outPath = path.join(process.cwd(), 'public', 'og-image.png')

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error('Failed to fetch:', res.statusCode)
    process.exit(1)
  }
  const chunks = []
  res.on('data', (chunk) => chunks.push(chunk))
  res.on('end', () => {
    const buf = Buffer.concat(chunks)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, buf)
    console.log('Saved', buf.length, 'bytes to', outPath)
  })
}).on('error', (e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
