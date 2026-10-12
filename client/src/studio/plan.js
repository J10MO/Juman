// House plans: rooms laid out on the floor plane, plus the walls, doors and
// windows generated from them. Rooms are axis-aligned rectangles that share
// edges exactly; each wall is built as two half-thickness skins so every room
// can have its own wall colour.

export const WALL_T = 0.12
export const WALL_H = 2.7
const DOOR = { w: 0.9, h: 2.1 }
const ENTRANCE = { w: 1.1, h: 2.2 }
const EXTERIOR_COLOR = '#e4ddd0'
const EPS = 1e-3

export const ROOM_TYPES = {
  living: { name: 'الهول', floor: 'oak', wallColor: '#ece6dc' },
  guest: { name: 'غرفة الخطار', floor: 'walnut', wallColor: '#e3cfc0' },
  bedroom: { name: 'غرفة النوم', floor: 'walnut', wallColor: '#d9cbb4' },
  kids: { name: 'غرفة الأطفال', floor: 'oak', wallColor: '#c9d3cf' },
  kitchen: { name: 'المطبخ', floor: 'terrazzo', wallColor: '#f5f1ea' },
  bathroom: { name: 'الحمام', floor: 'marble', wallColor: '#b7c4cf' },
  office: { name: 'المكتب', floor: 'oak', wallColor: '#8f9e8b' },
  hall: { name: 'الممر', floor: 'terrazzo', wallColor: '#f5f1ea' },
}

/** Build a room from its edges (x0..x1, z0..z1). */
const R = (id, type, x0, x1, z0, z1, name) => ({
  id,
  type,
  name: name || ROOM_TYPES[type].name,
  x: (x0 + x1) / 2,
  z: (z0 + z1) / 2,
  width: x1 - x0,
  depth: z1 - z0,
  floor: ROOM_TYPES[type].floor,
  wallColor: ROOM_TYPES[type].wallColor,
})

export const TEMPLATES = {
  room: {
    name: 'غرفة وحدة',
    blurb: 'غرفة وحدة تتحكم بقياسها. مناسبة إذا تريد ترتب الصالة أو غرفة النوم بس.',
    rooms: [R('r1', 'living', -3, 3, -2.5, 2.5, 'غرفتي')],
    doors: [],
  },
  apartment: {
    name: 'شقة غرفتين',
    blurb: 'هول ومطبخ مفتوح، غرفتين نوم وحمام. حوالي ٨٠ متر.',
    rooms: [
      R('living', 'living', -5, 1, -4, 0.5),
      R('kitchen', 'kitchen', 1, 5, -4, 0.5),
      R('bedroom', 'bedroom', -5, -1, 0.5, 4),
      R('bath', 'bathroom', -1, 1.4, 0.5, 4),
      R('kids', 'kids', 1.4, 5, 0.5, 4),
    ],
    doors: [
      ['living', 'kitchen'], ['living', 'bedroom'], ['living', 'bath'], ['kitchen', 'kids'], ['living', 'out:n'],
    ],
  },
  house: {
    name: 'بيت كامل',
    blurb: 'بيت عراقي كامل: ديوانية للخطار، هول، مطبخ، ممر، ثلاث غرف وحمام. حوالي ١٥٠ متر.',
    rooms: [
      R('guest', 'guest', -7, -2, -5.5, -1),
      R('living', 'living', -2, 3.5, -5.5, -1),
      R('kitchen', 'kitchen', 3.5, 7, -5.5, -1),
      R('hall', 'hall', -7, 7, -1, 1),
      R('master', 'bedroom', -7, -2, 1, 5.5, 'غرفة النوم الرئيسية'),
      R('bath', 'bathroom', -2, 0.5, 1, 5.5),
      R('kids', 'kids', 0.5, 4, 1, 5.5),
      R('office', 'office', 4, 7, 1, 5.5),
    ],
    doors: [
      ['guest', 'out:n'], ['hall', 'out:w'], ['guest', 'hall'], ['living', 'hall'], ['kitchen', 'hall'],
      ['living', 'kitchen'], ['master', 'hall'], ['bath', 'hall'], ['kids', 'hall'], ['office', 'hall'],
    ],
  },
}

export function makePlan(templateKey) {
  const t = TEMPLATES[templateKey] || TEMPLATES.room
  return { template: TEMPLATES[templateKey] ? templateKey : 'room', rooms: t.rooms.map((r) => ({ ...r })) }
}

/** Old single-room designs stored `room: { width, depth, wallColor, floor }`. */
export function planFromLegacyRoom(room) {
  const r = R('r1', 'living', -room.width / 2, room.width / 2, -room.depth / 2, room.depth / 2, 'غرفتي')
  return { template: 'room', rooms: [{ ...r, floor: room.floor || r.floor, wallColor: room.wallColor || r.wallColor }] }
}

export function planBounds(rooms) {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const r of rooms) {
    minX = Math.min(minX, r.x - r.width / 2)
    maxX = Math.max(maxX, r.x + r.width / 2)
    minZ = Math.min(minZ, r.z - r.depth / 2)
    maxZ = Math.max(maxZ, r.z + r.depth / 2)
  }
  return { minX, maxX, minZ, maxZ, width: maxX - minX, depth: maxZ - minZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 }
}

export const roomArea = (r) => Math.round(r.width * r.depth * 10) / 10

/** The room containing a point, or the nearest one. */
export function roomAt(rooms, x, z) {
  let best = null
  for (const r of rooms) {
    const dx = Math.max(Math.abs(x - r.x) - r.width / 2, 0)
    const dz = Math.max(Math.abs(z - r.z) - r.depth / 2, 0)
    const d = dx * dx + dz * dz
    if (!best || d < best.d) best = { r, d }
  }
  return best?.r || null
}

// ---------------------------------------------------------------------------
// Walls

/** The four sides of a room as lines. `inward` points into the room. */
function sides(r) {
  const x0 = r.x - r.width / 2
  const x1 = r.x + r.width / 2
  const z0 = r.z - r.depth / 2
  const z1 = r.z + r.depth / 2
  return [
    { side: 'n', axis: 'x', c: z0, a: x0, b: x1, inward: 1 }, // wall along x at z = z0, room is at +z
    { side: 's', axis: 'x', c: z1, a: x0, b: x1, inward: -1 },
    { side: 'w', axis: 'z', c: x0, a: z0, b: z1, inward: 1 },
    { side: 'e', axis: 'z', c: x1, a: z0, b: z1, inward: -1 },
  ]
}

/** Split a side into pieces shared with neighbours and exterior pieces. */
function pieces(room, s, rooms) {
  const shared = []
  for (const q of rooms) {
    if (q.id === room.id) continue
    for (const t of sides(q)) {
      if (t.axis !== s.axis || t.inward === s.inward || Math.abs(t.c - s.c) > EPS) continue
      const a = Math.max(s.a, t.a)
      const b = Math.min(s.b, t.b)
      if (b - a > EPS) shared.push({ a, b, neighbour: q.id })
    }
  }
  shared.sort((p, q) => p.a - q.a)
  const out = []
  let cursor = s.a
  for (const p of shared) {
    if (p.a - cursor > EPS) out.push({ a: cursor, b: p.a, neighbour: null })
    out.push(p)
    cursor = p.b
  }
  if (s.b - cursor > EPS) out.push({ a: cursor, b: s.b, neighbour: null })
  return out
}

const pairKey = (a, b) => [a, b].sort().join('|')

/**
 * Turn a plan into renderable wall skins, door/window openings and corner posts.
 * Each skin: { key, x, z, len, axis, thick, y0, y1, color, exterior, normal:[nx,nz] }
 */
export function buildWalls(plan, doorsSpec = TEMPLATES[plan.template]?.doors || []) {
  const { rooms } = plan
  const doorPairs = new Set(doorsSpec.filter(([, b]) => !b.startsWith('out:')).map(([a, b]) => pairKey(a, b)))
  const entrances = new Set(doorsSpec.filter(([, b]) => b.startsWith('out:')).map(([a, b]) => `${a}:${b.slice(4)}`))

  // Pick the opening for each piece once, so both skins of a wall agree.
  const openings = new Map() // pieceKey -> opening
  const usedPairs = new Set()
  const windowRooms = new Set()

  const allPieces = []
  for (const r of rooms) {
    for (const s of sides(r)) {
      for (const p of pieces(r, s, rooms)) allPieces.push({ r, s, p, len: p.b - p.a })
    }
  }
  const pieceKey = (s, p) => `${s.axis}:${s.c.toFixed(3)}:${p.a.toFixed(3)}:${p.b.toFixed(3)}`

  // doors between rooms: the longest shared piece of each requested pair
  const byPair = new Map()
  for (const it of allPieces) {
    if (!it.p.neighbour) continue
    const k = pairKey(it.r.id, it.p.neighbour)
    if (!doorPairs.has(k)) continue
    if (!byPair.has(k) || byPair.get(k).len < it.len) byPair.set(k, it)
  }
  for (const [k, it] of byPair) {
    if (it.len < DOOR.w + 0.2) continue
    openings.set(pieceKey(it.s, it.p), { type: 'door', at: (it.p.a + it.p.b) / 2, ...DOOR })
    usedPairs.add(k)
  }

  // exterior: entrance doors, then one window per room on its longest outside piece
  const exterior = allPieces.filter((it) => !it.p.neighbour).sort((a, b) => b.len - a.len)
  for (const it of exterior) {
    const k = pieceKey(it.s, it.p)
    if (entrances.has(`${it.r.id}:${it.s.side}`) && !openings.has(k) && it.len >= ENTRANCE.w + 0.3) {
      openings.set(k, { type: 'entrance', at: (it.p.a + it.p.b) / 2, ...ENTRANCE })
      entrances.delete(`${it.r.id}:${it.s.side}`)
    }
  }
  for (const it of exterior) {
    const k = pieceKey(it.s, it.p)
    if (openings.has(k) || windowRooms.has(it.r.id) || it.r.type === 'hall') continue
    const bath = it.r.type === 'bathroom'
    const w = bath ? 0.7 : Math.min(1.8, it.len - 0.9)
    if (w < 0.6) continue
    openings.set(k, bath ? { type: 'window', at: (it.p.a + it.p.b) / 2, w, sill: 1.6, h: 0.6 } : { type: 'window', at: (it.p.a + it.p.b) / 2, w, sill: 0.85, h: 1.4 })
    windowRooms.add(it.r.id)
  }

  const skins = []
  const decor = [] // door/window frames, rendered once per opening
  const seenDecor = new Set()
  for (const { r, s, p } of allPieces) {
    const k = pieceKey(s, p)
    const op = openings.get(k)
    const ext = !p.neighbour
    const outward = [s.axis === 'z' ? -s.inward : 0, s.axis === 'x' ? -s.inward : 0]
    const emit = (side, color) => {
      // side: +1 = inner skin (inside r), -1 = outer skin
      const offset = s.c + s.inward * side * (WALL_T / 4)
      const push = (a, b, y0, y1, part) => {
        if (b - a < EPS || y1 - y0 < EPS) return
        const mid = (a + b) / 2
        skins.push({
          key: `${r.id}:${k}:${side}:${part}:${a.toFixed(3)}:${y0}`,
          group: k,
          x: s.axis === 'x' ? mid : offset,
          z: s.axis === 'x' ? offset : mid,
          len: b - a,
          axis: s.axis,
          y0,
          y1,
          color,
          exterior: ext,
          normal: outward,
          line: s.c,
        })
      }
      if (!op) return push(p.a, p.b, 0, WALL_H, 'full')
      const o0 = op.at - op.w / 2
      const o1 = op.at + op.w / 2
      push(p.a, o0, 0, WALL_H, 'l')
      push(o1, p.b, 0, WALL_H, 'r')
      if (op.type === 'window') {
        push(o0, o1, 0, op.sill, 'sill')
        push(o0, o1, op.sill + op.h, WALL_H, 'top')
      } else {
        push(o0, o1, op.h, WALL_H, 'top')
      }
    }
    emit(1, r.wallColor)
    if (ext) emit(-1, EXTERIOR_COLOR)
    if (op && !seenDecor.has(k)) {
      seenDecor.add(k)
      decor.push({
        key: k,
        ...op,
        axis: s.axis,
        x: s.axis === 'x' ? op.at : s.c,
        z: s.axis === 'x' ? s.c : op.at,
        exterior: ext,
        normal: outward,
        // swing doors into the room they belong to
        inward: s.inward,
      })
    }
  }

  // corner posts fill the gaps where skins meet
  const posts = new Map()
  for (const r of rooms) {
    for (const [x, z] of [
      [r.x - r.width / 2, r.z - r.depth / 2], [r.x + r.width / 2, r.z - r.depth / 2],
      [r.x - r.width / 2, r.z + r.depth / 2], [r.x + r.width / 2, r.z + r.depth / 2],
    ]) {
      posts.set(`${x.toFixed(3)}:${z.toFixed(3)}`, { x, z })
    }
  }

  return { skins, decor, posts: [...posts.values()], usedPairs }
}
