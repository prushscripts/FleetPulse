/**
 * Generates public/og-image.png for link previews (static file = fast load for iMessage).
 * Run: node scripts/generate-og-image.js
 */
const sharp = require('sharp')
const path = require('path')

const width = 2400
const height = 1256
const outPath = path.join(process.cwd(), 'public', 'og-image.png')

async function main() {
  const leftHalf = await sharp({
    create: {
      width: width / 2,
      height,
      channels: 3,
      background: { r: 79, g: 70, b: 229 },
    },
  })
    .png()
    .toBuffer()

  const rightHalf = await sharp({
    create: {
      width: width / 2,
      height,
      channels: 3,
      background: { r: 124, g: 58, b: 237 },
    },
  })
    .png()
    .toBuffer()

  await sharp({
    create: { width, height, channels: 3, background: { r: 79, g: 70, b: 229 } },
  })
    .composite([{ input: rightHalf, left: width / 2, top: 0 }])
    .png()
    .toFile(outPath)

  console.log('Generated', outPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
