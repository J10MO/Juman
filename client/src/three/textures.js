// Procedurally generated textures so the models look realistic without
// downloading any image or model files. Every texture is generated once and cached.
import * as THREE from 'three'

const cache = new Map()

function seeded(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvasTexture(key, size, draw, { color = true, repeat = [1, 1] } = {}) {
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = size[0]
  canvas.height = size[1]
  draw(canvas.getContext('2d'), size[0], size[1])
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat[0], repeat[1])
  tex.anisotropy = 8
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  cache.set(key, tex)
  return tex
}

/** Light wood grain; multiply it with a material colour to tint it. */
export function woodGrain() {
  return canvasTexture('wood', [512, 512], (ctx, w, h) => {
    const rnd = seeded(7)
    ctx.fillStyle = '#e9e1d6'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 140; i++) {
      const y0 = rnd() * h
      const amp = 2 + rnd() * 8
      const freq = 0.004 + rnd() * 0.01
      const phase = rnd() * Math.PI * 2
      const dark = rnd() < 0.5
      ctx.strokeStyle = dark ? `rgba(70,45,25,${0.05 + rnd() * 0.14})` : `rgba(255,250,240,${0.05 + rnd() * 0.1})`
      ctx.lineWidth = 0.6 + rnd() * 2.4
      ctx.beginPath()
      for (let x = 0; x <= w; x += 4) {
        const y = y0 + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1) * amp * 0.25
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    // a few knots
    for (let i = 0; i < 3; i++) {
      const cx = rnd() * w
      const cy = rnd() * h
      for (let r = 14; r > 2; r -= 2.5) {
        ctx.strokeStyle = `rgba(60,38,20,${0.08 + (14 - r) * 0.012})`
        ctx.beginPath()
        ctx.ellipse(cx, cy, r * 2.4, r, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  })
}

/** Woven fabric bump map (non-colour data). */
export function fabricBump() {
  return canvasTexture(
    'fabric',
    [256, 256],
    (ctx, w, h) => {
      const rnd = seeded(3)
      const img = ctx.createImageData(w, h)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const weave = ((x >> 1) % 2 === 0) !== ((y >> 1) % 2 === 0) ? 150 : 105
          const v = weave + (rnd() - 0.5) * 60
          const i = (y * w + x) * 4
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v
          img.data[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    },
    { color: false, repeat: [6, 6] },
  )
}

const FLOORS = {
  oak: { base: '#c9a476', dark: '#9d7650', light: '#dfc095' },
  walnut: { base: '#7a5236', dark: '#5a3a24', light: '#946649' },
  marble: { base: '#e9e6e1', dark: '#c9c4bb', light: '#f6f4f0' },
  terrazzo: { base: '#d9d2c5', dark: '#a8998a', light: '#efe9de' },
}
export const FLOOR_NAMES = { oak: 'باركيه بلوط', walnut: 'باركيه جوز', marble: 'مرمر', terrazzo: 'كاشي موزائيك' }

/** Floor texture covering 4x4 metres; set repeat to room size / 4. */
export function floorTexture(type = 'oak') {
  const p = FLOORS[type] || FLOORS.oak
  return canvasTexture(`floor-${type}`, [1024, 1024], (ctx, w, h) => {
    const rnd = seeded(type.length * 31)
    ctx.fillStyle = p.base
    ctx.fillRect(0, 0, w, h)

    if (type === 'marble') {
      const tile = w / 4
      for (let i = 0; i < 16; i++) {
        const tx = (i % 4) * tile
        const ty = Math.floor(i / 4) * tile
        ctx.fillStyle = rnd() > 0.5 ? p.base : p.light
        ctx.fillRect(tx, ty, tile, tile)
        for (let v = 0; v < 6; v++) {
          ctx.strokeStyle = `rgba(120,115,105,${0.08 + rnd() * 0.18})`
          ctx.lineWidth = 0.5 + rnd() * 1.5
          ctx.beginPath()
          let x = tx + rnd() * tile
          let y = ty
          ctx.moveTo(x, y)
          while (y < ty + tile) {
            x += (rnd() - 0.5) * 30
            y += 10 + rnd() * 20
            ctx.lineTo(Math.min(Math.max(x, tx), tx + tile), Math.min(y, ty + tile))
          }
          ctx.stroke()
        }
        ctx.strokeStyle = 'rgba(150,140,128,0.55)'
        ctx.lineWidth = 2
        ctx.strokeRect(tx + 1, ty + 1, tile - 2, tile - 2)
      }
      return
    }

    if (type === 'terrazzo') {
      const tile = w / 4
      for (let i = 0; i < 9000; i++) {
        const r = 1 + rnd() * 4
        const shades = ['#8b7d6b', '#b5a58f', '#f3eee6', '#6f6255', '#c7643f', '#40505c']
        ctx.fillStyle = shades[Math.floor(rnd() * shades.length)]
        ctx.globalAlpha = 0.55 + rnd() * 0.45
        ctx.beginPath()
        ctx.ellipse(rnd() * w, rnd() * h, r, r * (0.5 + rnd() * 0.5), rnd() * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.strokeStyle = 'rgba(110,100,90,0.5)'
      ctx.lineWidth = 2
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(w, i * tile); ctx.stroke()
      }
      return
    }

    // Wooden planks: 4 m wide texture, planks 16 cm wide, staggered lengths.
    const plankW = w / 25
    for (let col = 0; col < 25; col++) {
      let y = -rnd() * h
      while (y < h) {
        const len = h * (0.25 + rnd() * 0.35)
        const shade = rnd()
        ctx.fillStyle = shade < 0.33 ? p.dark : shade < 0.66 ? p.base : p.light
        ctx.globalAlpha = 0.45 + rnd() * 0.35
        ctx.fillRect(col * plankW, y, plankW, len)
        ctx.globalAlpha = 1
        for (let g = 0; g < 7; g++) {
          ctx.strokeStyle = `rgba(50,30,15,${0.04 + rnd() * 0.08})`
          ctx.lineWidth = 0.5 + rnd()
          const gx = col * plankW + rnd() * plankW
          ctx.beginPath()
          ctx.moveTo(gx, y)
          ctx.bezierCurveTo(gx + (rnd() - 0.5) * 8, y + len / 3, gx + (rnd() - 0.5) * 8, y + (2 * len) / 3, gx, y + len)
          ctx.stroke()
        }
        ctx.fillStyle = 'rgba(40,25,12,0.55)'
        ctx.fillRect(col * plankW, y, plankW, 1.5)
        y += len
      }
      ctx.fillStyle = 'rgba(40,25,12,0.5)'
      ctx.fillRect(col * plankW, 0, 1.5, h)
    }
  })
}

/** Traditional-patterned rug (زولية) in the given main colour. */
export function rugTexture(main = '#8e2f2a') {
  return canvasTexture(`rug-${main}`, [1024, 724], (ctx, w, h) => {
    const rnd = seeded(11)
    const cream = '#efe3c8'
    const navy = '#1f2f45'
    const gold = '#c8a45c'
    ctx.fillStyle = main
    ctx.fillRect(0, 0, w, h)

    // borders
    const bands = [
      [0, cream], [14, navy], [40, main], [52, gold], [60, navy], [92, cream], [100, main],
    ]
    bands.forEach(([inset, col], i) => {
      const next = bands[i + 1]?.[0] ?? inset + 8
      ctx.fillStyle = col
      ctx.fillRect(inset, inset, w - inset * 2, h - inset * 2)
      if (col === navy) {
        // little diamonds along the navy band
        ctx.fillStyle = gold
        const mid = inset + (next - inset) / 2
        for (let x = inset + 20; x < w - inset - 10; x += 28) {
          diamond(ctx, x, mid, 7)
          diamond(ctx, x, h - mid, 7)
        }
        for (let y = inset + 20; y < h - inset - 10; y += 28) {
          diamond(ctx, mid, y, 7)
          diamond(ctx, w - mid, y, 7)
        }
        ctx.fillStyle = col
      }
    })

    // field pattern
    ctx.save()
    ctx.beginPath()
    ctx.rect(100, 100, w - 200, h - 200)
    ctx.clip()
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    for (let x = 100; x < w - 100; x += 44) {
      for (let y = 100; y < h - 100; y += 44) diamond(ctx, x + 22, y + 22, 10)
    }
    // central medallion
    const cx = w / 2
    const cy = h / 2
    ctx.fillStyle = navy
    diamond(ctx, cx, cy, 190, 0.62)
    ctx.fillStyle = cream
    diamond(ctx, cx, cy, 150, 0.62)
    ctx.fillStyle = main
    diamond(ctx, cx, cy, 120, 0.62)
    ctx.fillStyle = gold
    diamond(ctx, cx, cy, 60, 0.7)
    ctx.fillStyle = navy
    diamond(ctx, cx, cy, 28, 0.7)
    // corner pieces
    ctx.fillStyle = navy
    ;[[100, 100], [w - 100, 100], [100, h - 100], [w - 100, h - 100]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(x, y, 70, 0, Math.PI * 2); ctx.fill()
    })
    ctx.restore()

    // wool fibre noise
    const img = ctx.getImageData(0, 0, w, h)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (rnd() - 0.5) * 26
      img.data[i] += n
      img.data[i + 1] += n
      img.data[i + 2] += n
    }
    ctx.putImageData(img, 0, 0)
  })
}

function diamond(ctx, x, y, r, squash = 1) {
  ctx.beginPath()
  ctx.moveTo(x, y - r * squash)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x, y + r * squash)
  ctx.lineTo(x - r, y)
  ctx.closePath()
  ctx.fill()
}

/** Tiny deterministic RNG helper for models (books, leaves…). */
export const rng = seeded

// ---------------------------------------------------------------------------
// Modern materials

const MARBLES = {
  carrara: { base: '#f1efeb', vein: 'rgba(120,118,115,', fine: 'rgba(150,148,145,' },
  nero: { base: '#1d1d1f', vein: 'rgba(235,232,225,', fine: 'rgba(200,198,190,' },
  verde: { base: '#2f4a3e', vein: 'rgba(225,235,225,', fine: 'rgba(160,190,170,' },
  rosa: { base: '#e9d6cc', vein: 'rgba(150,110,95,', fine: 'rgba(190,150,135,' },
}

/** A single marble slab (not tiled): soft cloudy base with branching veins. */
export function marbleTexture(kind = 'carrara') {
  const m = MARBLES[kind] || MARBLES.carrara
  return canvasTexture(`marble-${kind}`, [1024, 1024], (ctx, w, h) => {
    const rand = seeded(kind.length * 97)
    ctx.fillStyle = m.base
    ctx.fillRect(0, 0, w, h)
    // cloudy depth
    for (let i = 0; i < 40; i++) {
      const g = ctx.createRadialGradient(rand() * w, rand() * h, 0, rand() * w, rand() * h, 120 + rand() * 260)
      g.addColorStop(0, m.fine + '0.06)')
      g.addColorStop(1, m.fine + '0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
    const vein = (alpha, width, steps, blur) => {
      ctx.filter = blur ? `blur(${blur}px)` : 'none'
      ctx.strokeStyle = m.vein + alpha + ')'
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      let x = rand() * w
      let y = -20
      let a = Math.PI / 2 + (rand() - 0.5) * 1.2
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let i = 0; i < steps; i++) {
        a += (rand() - 0.5) * 0.5
        x += Math.cos(a) * 14
        y += Math.abs(Math.sin(a)) * 14 + 2
        ctx.lineTo(x, y)
        if (rand() < 0.04) {
          // branch
          ctx.moveTo(x, y)
        }
      }
      ctx.stroke()
    }
    for (let i = 0; i < 5; i++) vein(0.35, 6 + rand() * 6, 90, 4)
    for (let i = 0; i < 7; i++) vein(0.55, 1.2 + rand() * 1.5, 90, 0)
    for (let i = 0; i < 14; i++) vein(0.25, 0.6, 70, 0)
    ctx.filter = 'none'
  })
}

/** Travertine: warm beige with horizontal bands and small pores. */
export function travertineTexture() {
  return canvasTexture('travertine', [1024, 1024], (ctx, w, h) => {
    const rand = seeded(55)
    ctx.fillStyle = '#d9c7aa'
    ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(${150 + rand() * 60},${125 + rand() * 50},${90 + rand() * 40},${0.05 + rand() * 0.08})`
      ctx.fillRect(0, y + Math.sin(y * 0.05) * 3, w, 1 + rand() * 4)
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(120,95,65,${0.15 + rand() * 0.3})`
      ctx.beginPath()
      ctx.ellipse(rand() * w, rand() * h, 1 + rand() * 7, 0.5 + rand() * 1.4, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

/** Bouclé: tiny loops of yarn (bump map). */
export function boucleBump() {
  return canvasTexture(
    'boucle',
    [512, 512],
    (ctx, w, h) => {
      const rand = seeded(77)
      ctx.fillStyle = '#7a7a7a'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 9000; i++) {
        const r = 1.5 + rand() * 2.5
        ctx.strokeStyle = rand() < 0.5 ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)'
        ctx.lineWidth = 0.8 + rand()
        ctx.beginPath()
        ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    { color: false, repeat: [5, 5] },
  )
}
