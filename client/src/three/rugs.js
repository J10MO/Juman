// Procedural rug designs. Each pattern paints a canvas sized to the rug's
// proportions, so motifs never stretch. Colours derive from the chosen main colour.
import * as THREE from 'three'
import { rng, rugTexture } from './textures.js'

const cache = new Map()
const CREAM = '#efe3c8'
const INK = '#1f2a3a'
const GOLD = '#c8a45c'

const shade = (hex, l) => '#' + new THREE.Color(hex).offsetHSL(0, 0, l).getHexString()
const hue = (hex, h, s = 0, l = 0) => '#' + new THREE.Color(hex).offsetHSL(h, s, l).getHexString()

function diamond(ctx, x, y, rx, ry = rx) {
  ctx.beginPath()
  ctx.moveTo(x, y - ry)
  ctx.lineTo(x + rx, y)
  ctx.lineTo(x, y + ry)
  ctx.lineTo(x - rx, y)
  ctx.closePath()
  ctx.fill()
}

/** Wool fibre grain on top of any design. */
function fibres(ctx, w, h, amount, seed) {
  const rand = rng(seed)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * amount
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

/** Short random strokes: a deep pile / shaggy look. */
function pile(ctx, w, h, color, count, seed, len = 6) {
  const rand = rng(seed)
  ctx.lineCap = 'round'
  for (let i = 0; i < count; i++) {
    const x = rand() * w
    const y = rand() * h
    const a = rand() * Math.PI * 2
    ctx.strokeStyle = shade(color, (rand() - 0.5) * 0.18)
    ctx.globalAlpha = 0.35 + rand() * 0.4
    ctx.lineWidth = 1 + rand() * 1.6
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * len * (0.5 + rand()), y + Math.sin(a) * len * (0.5 + rand()))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

const PATTERNS = {
  // تبريزي: double border, scattered blossoms and an oval medallion with petals
  tabriz(ctx, w, h, main) {
    const dark = shade(main, -0.14)
    ctx.fillStyle = CREAM
    ctx.fillRect(0, 0, w, h)
    const b = h * 0.11
    ctx.fillStyle = INK
    ctx.fillRect(b * 0.3, b * 0.3, w - b * 0.6, h - b * 0.6)
    ctx.fillStyle = dark
    ctx.fillRect(b * 0.55, b * 0.55, w - b * 1.1, h - b * 1.1)
    // vine in the outer border
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let x = b * 0.6; x < w - b * 0.6; x += 6) ctx.lineTo(x, b * 0.78 + Math.sin(x / 14) * b * 0.12)
    ctx.stroke()
    ctx.beginPath()
    for (let x = b * 0.6; x < w - b * 0.6; x += 6) ctx.lineTo(x, h - b * 0.78 + Math.sin(x / 14) * b * 0.12)
    ctx.stroke()
    ctx.fillStyle = CREAM
    ctx.fillRect(b, b, w - 2 * b, h - 2 * b)
    ctx.fillStyle = main
    ctx.fillRect(b * 1.15, b * 1.15, w - 2.3 * b, h - 2.3 * b)
    // scattered blossoms on the field
    const rand = rng(41)
    for (let i = 0; i < 160; i++) {
      const x = b * 1.3 + rand() * (w - 2.6 * b)
      const y = b * 1.3 + rand() * (h - 2.6 * b)
      const r = 5 + rand() * 6
      ctx.fillStyle = [CREAM, GOLD, INK, shade(main, 0.15)][i % 4]
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.45, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // central oval medallion with petals
    const cx = w / 2
    const cy = h / 2
    for (const [rx, ry, c] of [[w * 0.2, h * 0.3, INK], [w * 0.18, h * 0.27, CREAM], [w * 0.15, h * 0.23, dark], [w * 0.07, h * 0.11, GOLD]]) {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = CREAM
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2
      ctx.save()
      ctx.translate(cx + Math.cos(a) * w * 0.11, cy + Math.sin(a) * h * 0.17)
      ctx.rotate(a)
      diamond(ctx, 0, 0, w * 0.02, h * 0.012)
      ctx.restore()
    }
    // corner spandrels: quarter medallions tucked into the field corners
    ctx.save()
    ctx.beginPath()
    ctx.rect(b * 1.15, b * 1.15, w - 2.3 * b, h - 2.3 * b)
    ctx.clip()
    for (const [x, y] of [[b * 1.15, b * 1.15], [w - b * 1.15, b * 1.15], [b * 1.15, h - b * 1.15], [w - b * 1.15, h - b * 1.15]]) {
      for (const [r, c] of [[0.13, INK], [0.1, CREAM], [0.07, dark]]) {
        ctx.fillStyle = c
        ctx.beginPath()
        ctx.arc(x, y, h * r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
    fibres(ctx, w, h, 20, 43)
  },

  // كليم: flat-woven bands of stepped triangles and diamonds
  kilim(ctx, w, h, main) {
    const palette = [main, CREAM, INK, GOLD, hue(main, 0.45, -0.1, 0.05)]
    ctx.fillStyle = main
    ctx.fillRect(0, 0, w, h)
    const band = w / 9
    for (let b = 0; b < 9; b++) {
      const x0 = b * band
      const c1 = palette[(b * 2 + 1) % palette.length]
      const c2 = palette[(b + 2) % palette.length]
      ctx.fillStyle = b % 2 ? c1 : main
      ctx.fillRect(x0, 0, band, h)
      ctx.fillStyle = c2
      ctx.fillRect(x0, 0, 6, h)
      // stepped diamonds down the band
      const r = band * 0.36
      for (let y = r; y < h; y += r * 2.2) {
        ctx.fillStyle = b % 2 ? main : c1
        for (let s = 4; s >= 1; s--) {
          ctx.fillStyle = s % 2 ? (b % 2 ? main : c1) : c2
          diamond(ctx, x0 + band / 2, y, (r * s) / 4, (r * s) / 4)
        }
      }
    }
    fibres(ctx, w, h, 22, 31)
  },

  // مغربية (بني ورين): ivory pile with a hand-drawn diamond lattice
  beni(ctx, w, h, main) {
    ctx.fillStyle = '#ece5d6'
    ctx.fillRect(0, 0, w, h)
    pile(ctx, w, h, '#ece5d6', 9000, 4, 7)
    const rand = rng(8)
    ctx.strokeStyle = main
    ctx.lineWidth = 12
    ctx.lineJoin = 'round'
    const step = w / 7
    for (let k = -h; k < w + h; k += step) {
      for (const dir of [1, -1]) {
        ctx.beginPath()
        for (let y = 0; y <= h; y += 24) {
          const x = k + dir * y * 0.9 + (rand() - 0.5) * 6
          y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.globalAlpha = 0.85
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    pile(ctx, w, h, '#ece5d6', 1200, 12, 4)
  },

  // مودرن: soft abstract arcs and colour fields
  modern(ctx, w, h, main) {
    const tones = [shade(main, -0.18), shade(main, 0.1), '#efe9df', GOLD, hue(main, 0.08, 0, -0.1)]
    ctx.fillStyle = main
    ctx.fillRect(0, 0, w, h)
    const rand = rng(17)
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = tones[i % tones.length]
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.arc(rand() * w, rand() * h, (0.2 + rand() * 0.35) * h, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.strokeStyle = INK
    ctx.lineWidth = 3
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.arc(rand() * w, rand() * h, (0.15 + rand() * 0.3) * h, rand() * 3, rand() * 3 + 2)
      ctx.stroke()
    }
    fibres(ctx, w, h, 16, 5)
  },

  // مدورة: concentric rings with a central rosette (drawn in a square)
  round(ctx, w, h, main) {
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) / 2
    ctx.fillStyle = main
    ctx.fillRect(0, 0, w, h)
    const rings = [[1, CREAM], [0.94, INK], [0.88, main], [0.84, GOLD], [0.8, main], [0.5, CREAM], [0.45, INK], [0.4, main]]
    for (const [r, c] of rings) {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.arc(cx, cy, R * r, 0, Math.PI * 2)
      ctx.fill()
    }
    // petals
    ctx.fillStyle = GOLD
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      ctx.save()
      ctx.translate(cx + Math.cos(a) * R * 0.65, cy + Math.sin(a) * R * 0.65)
      ctx.rotate(a)
      diamond(ctx, 0, 0, R * 0.09, R * 0.04)
      ctx.restore()
    }
    ctx.fillStyle = CREAM
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.ellipse(cx + Math.cos(a) * R * 0.2, cy + Math.sin(a) * R * 0.2, R * 0.12, R * 0.05, a, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.arc(cx, cy, R * 0.08, 0, Math.PI * 2)
    ctx.fill()
    fibres(ctx, w, h, 20, 9)
  },

  // سجادة صلاة: border, field and a mihrab arch pointing to one end
  prayer(ctx, w, h, main) {
    ctx.fillStyle = CREAM
    ctx.fillRect(0, 0, w, h)
    const b = h * 0.09
    ctx.fillStyle = INK
    ctx.fillRect(b * 0.4, b * 0.4, w - b * 0.8, h - b * 0.8)
    ctx.fillStyle = main
    ctx.fillRect(b, b, w - 2 * b, h - 2 * b)
    // small motifs in the border
    ctx.fillStyle = GOLD
    for (let x = b; x < w - b; x += b * 0.9) {
      diamond(ctx, x, b * 0.7, b * 0.2)
      diamond(ctx, x, h - b * 0.7, b * 0.2)
    }
    // mihrab: arch at the +x end of the rug
    const ax = w - b * 1.6
    const top = b * 1.6
    const bottom = h - b * 1.6
    const mid = h / 2
    ctx.fillStyle = shade(main, 0.08)
    ctx.beginPath()
    ctx.moveTo(b * 1.6, top)
    ctx.lineTo(ax - (bottom - top) * 0.45, top)
    ctx.quadraticCurveTo(ax, top, ax, mid)
    ctx.quadraticCurveTo(ax, bottom, ax - (bottom - top) * 0.45, bottom)
    ctx.lineTo(b * 1.6, bottom)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 4
    ctx.stroke()
    // hanging lamp
    ctx.fillStyle = GOLD
    ctx.beginPath()
    ctx.ellipse(ax - (bottom - top) * 0.3, mid, b * 0.35, b * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(ax - (bottom - top) * 0.3, mid - 2, (bottom - top) * 0.22, 4)
    // flowers in the field
    ctx.fillStyle = CREAM
    for (let i = 0; i < 3; i++) diamond(ctx, b * 3 + i * b * 1.6, mid, b * 0.35, b * 0.6)
    fibres(ctx, w, h, 22, 13)
  },

  // أطفال: a playmat with a road, houses and trees
  kids(ctx, w, h, main) {
    ctx.fillStyle = main
    ctx.fillRect(0, 0, w, h)
    const rand = rng(21)
    // grass patches
    ctx.fillStyle = '#b9d8a8'
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.ellipse(rand() * w, rand() * h, 60 + rand() * 80, 40 + rand() * 60, rand() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    // road loop
    const m = h * 0.18
    ctx.strokeStyle = '#5b6470'
    ctx.lineWidth = h * 0.12
    ctx.lineJoin = 'round'
    ctx.strokeRect(m, m, w - 2 * m, h - 2 * m)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.setLineDash([22, 18])
    ctx.strokeRect(m, m, w - 2 * m, h - 2 * m)
    ctx.setLineDash([])
    // houses
    const colors = ['#e76f51', '#f4a261', '#2a9d8f', '#e9c46a']
    for (let i = 0; i < 4; i++) {
      const x = w * (0.3 + i * 0.13)
      const y = h * 0.5
      ctx.fillStyle = colors[i]
      ctx.fillRect(x - 28, y - 10, 56, 44)
      ctx.fillStyle = '#7a3e2b'
      ctx.beginPath()
      ctx.moveTo(x - 34, y - 10)
      ctx.lineTo(x, y - 42)
      ctx.lineTo(x + 34, y - 10)
      ctx.fill()
    }
    // trees
    for (let i = 0; i < 8; i++) {
      const x = rand() * w
      const y = rand() < 0.5 ? m * 0.45 : h - m * 0.45
      ctx.fillStyle = '#5a9e5c'
      ctx.beginPath()
      ctx.arc(x, y, 18, 0, Math.PI * 2)
      ctx.fill()
    }
    fibres(ctx, w, h, 12, 2)
  },

  // فرو: thick plush pile in one colour
  shaggy(ctx, w, h, main) {
    ctx.fillStyle = main
    ctx.fillRect(0, 0, w, h)
    pile(ctx, w, h, main, 22000, 6, 9)
    fibres(ctx, w, h, 26, 7)
  },

  // مدّة ممر: long Persian runner with repeated guls
  runner(ctx, w, h, main) {
    ctx.fillStyle = CREAM
    ctx.fillRect(0, 0, w, h)
    const b = h * 0.14
    ctx.fillStyle = INK
    ctx.fillRect(b * 0.35, b * 0.35, w - b * 0.7, h - b * 0.7)
    ctx.fillStyle = main
    ctx.fillRect(b, b, w - 2 * b, h - 2 * b)
    ctx.fillStyle = GOLD
    for (let x = b; x < w - b; x += b * 0.8) {
      diamond(ctx, x, b * 0.68, b * 0.18)
      diamond(ctx, x, h - b * 0.68, b * 0.18)
    }
    const cy = h / 2
    const r = (h - 2 * b) * 0.36
    for (let x = b + r * 1.6; x < w - b - r; x += r * 3) {
      ctx.fillStyle = INK
      diamond(ctx, x, cy, r * 1.25, r)
      ctx.fillStyle = CREAM
      diamond(ctx, x, cy, r * 0.95, r * 0.75)
      ctx.fillStyle = main
      diamond(ctx, x, cy, r * 0.6, r * 0.48)
      ctx.fillStyle = GOLD
      diamond(ctx, x, cy, r * 0.25, r * 0.2)
    }
    fibres(ctx, w, h, 22, 19)
  },

  // بساط مخطط: Bedouin-style stripes in varying widths
  stripes(ctx, w, h, main) {
    const palette = [main, CREAM, INK, GOLD, hue(main, 0.5, -0.2, 0.05), shade(main, -0.12)]
    const rand = rng(23)
    let x = 0
    let i = 0
    while (x < w) {
      const sw = 10 + rand() * 60
      ctx.fillStyle = palette[i++ % palette.length]
      ctx.fillRect(x, 0, sw, h)
      if (sw > 40) {
        ctx.fillStyle = palette[(i + 2) % palette.length]
        for (let y = 20; y < h; y += 36) diamond(ctx, x + sw / 2, y, sw * 0.22, 9)
      }
      x += sw
    }
    fibres(ctx, w, h, 20, 29)
  },

  // دواسة حمام: soft ribbed cotton
  bath(ctx, w, h, main) {
    ctx.fillStyle = main
    ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 10) {
      ctx.fillStyle = shade(main, y % 20 ? 0.05 : -0.05)
      ctx.fillRect(0, y, w, 5)
    }
    pile(ctx, w, h, main, 5000, 3, 4)
  },
}

export const RUG_PATTERNS = Object.keys(PATTERNS).concat('medallion')

/** Texture for a rug design; `aspect` = width / depth so motifs keep their shape. */
export function rugDesignTexture(pattern, main, aspect = 1.4) {
  if (!PATTERNS[pattern]) {
    const t = rugTexture(main) // the original medallion design
    return t
  }
  const a = Math.round(aspect * 20) / 20
  const key = `${pattern}|${main}|${a}`
  if (cache.has(key)) return cache.get(key)
  const w = 1024
  const h = Math.max(160, Math.min(1024, Math.round(w / a)))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  PATTERNS[pattern](canvas.getContext('2d'), w, h, main)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  cache.set(key, tex)
  return tex
}
