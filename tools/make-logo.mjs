// Turns the brand logo (navy on a black background) into transparent web assets:
//   node make-logo.mjs <logo.png>
// Outputs to client/public/brand: logo.png (navy), logo-light.png (cream),
// mark.png / mark-light.png (house only) and the favicon / app icons.
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const src = process.argv[2]
if (!src) throw new Error('usage: node make-logo.mjs <logo.png>')
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'client', 'public', 'brand')
await mkdir(OUT, { recursive: true })

const NAVY = [20, 33, 61] // --ink
const CREAM = [246, 241, 231] // --pearl

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true })

/** Recolour: alpha comes from how far a pixel is from the black background. */
function tinted([r, g, b]) {
  const out = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const strength = Math.max(data[i], data[i + 1], data[i + 2]) / 51 // logo blue channel ≈ 51
    // smoothstep drops the faint JPEG ringing around the shapes but keeps soft edges
    const t = Math.min(1, Math.max(0, (strength - 0.4) / 0.4))
    out[j] = r
    out[j + 1] = g
    out[j + 2] = b
    out[j + 3] = Math.round(t * t * (3 - 2 * t) * 255)
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
}

const save = async (img, name) => {
  const buf = await img.png().toBuffer()
  return sharp(buf).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(path.join(OUT, name))
}

// whole logo
await save(tinted(NAVY), 'logo.png')
await save(tinted(CREAM), 'logo-light.png')

// house mark only (left part of the artwork)
const markBox = { left: 130, top: 310, width: 530, height: 545 }
const mark = async (rgb) => sharp(await tinted(rgb).png().toBuffer()).extract(markBox)
await save(await mark(NAVY), 'mark.png')
await save(await mark(CREAM), 'mark-light.png')

// app icons: navy house on a cream rounded tile
const markPng = await sharp(path.join(OUT, 'mark.png')).toBuffer()
async function icon(size, name, { rounded = true, pad = 0.18 } = {}) {
  const inner = Math.round(size * (1 - pad * 2))
  const art = await sharp(markPng).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  const r = rounded ? Math.round(size * 0.22) : 0
  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="rgb(${CREAM.join(',')})"/></svg>`,
  )
  await sharp(tile)
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, name))
}
await icon(64, 'favicon-64.png')
await icon(180, 'apple-touch-icon.png', { rounded: false })
await icon(192, 'icon-192.png')
await icon(512, 'icon-512.png')
await icon(512, 'icon-maskable-512.png', { rounded: false, pad: 0.24 })
console.log('brand assets written to', OUT)
