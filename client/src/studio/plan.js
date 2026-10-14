// House plans: rooms laid out on the floor plane, plus doors and windows
// ("openings") placed on their walls. Rooms are axis-aligned rectangles that
// share edges exactly; each wall is built as two half-thickness skins so every
// room can have its own wall colour.
//
// An opening lives on a wall line:
//   { id, type: 'door' | 'entrance' | 'window', axis: 'x' | 'z', line, at, w, h, sill? }
//   axis 'x' → wall runs along x at z = line, `at` is the x of its centre
//   axis 'z' → wall runs along z at x = line, `at` is the z of its centre

export const WALL_T = 0.12
export const WALL_H = 2.7
export const OPENING_DEFAULTS = {
  door: { w: 0.9, h: 2.1 },
  entrance: { w: 1.1, h: 2.2 },
  window: { w: 1.4, h: 1.4, sill: 0.85 },
}
const EXTERIOR_COLOR = '#e4ddd0'
const EPS = 1e-3
const MARGIN = 0.08 // keep openings this far from wall ends

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

let uidCounter = 0
const newId = (p) => `${p}${Date.now().toString(36)}${(uidCounter++).toString(36)}`

/** Build a room from its edges (x0..x1, z0..z1). */
export const R = (id, type, x0, x1, z0, z1, name) => ({
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
    doors: [['r1', 'out:s']],
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
  const plan = { template: TEMPLATES[templateKey] ? templateKey : 'room', rooms: t.rooms.map((r) => ({ ...r })) }
  return { ...plan, openings: defaultOpenings(plan, t.doors) }
}

/** Old single-room designs stored `room: { width, depth, wallColor, floor }`. */
export function planFromLegacyRoom(room) {
  const r = R('r1', 'living', -room.width / 2, room.width / 2, -room.depth / 2, room.depth / 2, 'غرفتي')
  const plan = { template: 'room', rooms: [{ ...r, floor: room.floor || r.floor, wallColor: room.wallColor || r.wallColor }] }
  return { ...plan, openings: defaultOpenings(plan, TEMPLATES.room.doors) }
}

/** Plans saved before doors/windows were editable get their openings generated once. */
export function ensureOpenings(plan) {
  if (Array.isArray(plan.openings)) return plan
  return { ...plan, openings: defaultOpenings(plan, TEMPLATES[plan.template]?.doors || []) }
}

/**
 * A house from room counts: public rooms along the front, a corridor, and the
 * private rooms behind it. Every room opens onto the corridor.
 */
export function generatePlan({ bedrooms = 2, bathrooms = 1, guest = true, office = false } = {}) {
  const front = []
  if (guest) front.push(['guest', 'guest', 4.6])
  front.push(['living', 'living', 5.2], ['kitchen', 'kitchen', 3.8])
  const back = []
  for (let i = 0; i < bedrooms; i++) back.push([`bed${i + 1}`, i === 0 ? 'bedroom' : 'kids', i === 0 ? 4.4 : 3.6])
  for (let i = 0; i < bathrooms; i++) back.push([`bath${i + 1}`, 'bathroom', 2.4])
  if (office) back.push(['office', 'office', 3.2])

  const sum = (row) => row.reduce((n, r) => n + r[2], 0)
  const W = Math.max(sum(front), sum(back))
  // stretch the shorter row: extra width goes to the living room / bedrooms
  const stretch = (row, keys) => {
    const extra = W - sum(row)
    const grow = row.filter((r) => keys.includes(r[1]))
    grow.forEach((r) => (r[2] += extra / grow.length))
  }
  stretch(front, ['living'])
  stretch(back, ['bedroom', 'kids', 'office'].filter((k) => back.some((r) => r[1] === k)).slice(0, 2))

  const digits = '٠١٢٣٤٥٦٧٨٩'
  const roomName = (id, type) => {
    const n = digits[Number(id.replace(/\D/g, ''))] || ''
    if (id === 'bed1') return bedrooms > 1 ? 'غرفة النوم الرئيسية' : undefined
    if (type === 'kids') return bedrooms > 2 ? `غرفة النوم ${n}` : undefined
    if (type === 'bathroom' && bathrooms > 1) return `الحمام ${n}`
    return undefined
  }

  const FRONT_D = 4.6
  const HALL_D = 1.8
  const BACK_D = 4.2
  const z0 = -(FRONT_D + HALL_D + BACK_D) / 2
  const rooms = []
  const place = (row, za, zb) => {
    let x = -W / 2
    for (const [id, type, w] of row) {
      rooms.push(R(id, type, x, x + w, za, zb, roomName(id, type)))
      x += w
    }
  }
  place(front, z0, z0 + FRONT_D)
  rooms.push(R('hall', 'hall', -W / 2, W / 2, z0 + FRONT_D, z0 + FRONT_D + HALL_D))
  place(back, z0 + FRONT_D + HALL_D, z0 + FRONT_D + HALL_D + BACK_D)

  const doors = rooms.filter((r) => r.id !== 'hall').map((r) => [r.id, 'hall'])
  doors.push(['living', 'kitchen'], [guest ? 'guest' : 'living', 'out:n'], ['hall', 'out:w'])
  const plan = { template: 'custom', rooms }
  return { ...plan, openings: defaultOpenings(plan, doors) }
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

export const roomRect = (r) => ({ x0: r.x - r.width / 2, x1: r.x + r.width / 2, z0: r.z - r.depth / 2, z1: r.z + r.depth / 2 })

/** Do two rooms overlap (sharing an edge is fine)? */
export function roomsOverlap(a, b) {
  const p = roomRect(a)
  const q = roomRect(b)
  return Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0) > 0.01 && Math.min(p.z1, q.z1) - Math.max(p.z0, q.z0) > 0.01
}

// ---------------------------------------------------------------------------
// Walls

/** The four sides of a room as lines. `inward` points into the room. */
export function sides(r) {
  const { x0, x1, z0, z1 } = roomRect(r)
  return [
    { side: 'n', axis: 'x', c: z0, a: x0, b: x1, inward: 1 }, // wall along x at z = z0, room is at +z
    { side: 's', axis: 'x', c: z1, a: x0, b: x1, inward: -1 },
    { side: 'w', axis: 'z', c: x0, a: z0, b: z1, inward: 1 },
    { side: 'e', axis: 'z', c: x1, a: z0, b: z1, inward: -1 },
  ]
}

/** Split a side into pieces shared with neighbours and exterior pieces. */
export function pieces(room, s, rooms) {
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

/** Every distinct wall piece of the plan (shared walls appear once). */
export function wallPieces(rooms) {
  const seen = new Map()
  for (const r of rooms) {
    for (const s of sides(r)) {
      for (const p of pieces(r, s, rooms)) {
        const key = `${s.axis}:${s.c.toFixed(3)}:${p.a.toFixed(3)}:${p.b.toFixed(3)}`
        if (!seen.has(key)) seen.set(key, { key, axis: s.axis, line: s.c, a: p.a, b: p.b, exterior: !p.neighbour, room: r, side: s })
      }
    }
  }
  return [...seen.values()]
}

/** The wall piece an opening sits on (it must fit inside it), or null. */
export function pieceFor(op, walls) {
  return (
    walls.find(
      (w) =>
        w.axis === op.axis &&
        Math.abs(w.line - op.line) < EPS &&
        op.at - op.w / 2 >= w.a + MARGIN - EPS &&
        op.at + op.w / 2 <= w.b - MARGIN + EPS,
    ) || null
  )
}

/** Keep `at` inside a wall piece so the opening fits. */
export const clampOnPiece = (at, w, piece) =>
  Math.min(piece.b - MARGIN - w / 2, Math.max(piece.a + MARGIN + w / 2, at))

/** Drop openings that no longer sit on any wall (after rooms moved or were deleted). */
export function cleanOpenings(plan) {
  const walls = wallPieces(plan.rooms)
  const openings = (plan.openings || []).filter((o) => pieceFor(o, walls))
  return openings.length === (plan.openings || []).length ? plan : { ...plan, openings }
}

const pairKey = (a, b) => [a, b].sort().join('|')

/** Default doors (from a template's door list) and one window per room. */
export function defaultOpenings(plan, doorsSpec = []) {
  const { rooms } = plan
  const doorPairs = new Set(doorsSpec.filter(([, b]) => !b.startsWith('out:')).map(([a, b]) => pairKey(a, b)))
  const entrances = new Set(doorsSpec.filter(([, b]) => b.startsWith('out:')).map(([a, b]) => `${a}:${b.slice(4)}`))
  const all = []
  for (const r of rooms) for (const s of sides(r)) for (const p of pieces(r, s, rooms)) all.push({ r, s, p, len: p.b - p.a })

  const openings = []
  const used = new Set() // piece keys that already carry an opening
  const keyOf = (it) => `${it.s.axis}:${it.s.c.toFixed(3)}:${it.p.a.toFixed(3)}:${it.p.b.toFixed(3)}`
  const add = (it, type, extra = {}) => {
    const d = OPENING_DEFAULTS[type]
    // doors swing into the room they were generated for
    const swing = type === 'window' ? undefined : it.s.inward
    openings.push({ id: newId('o'), type, axis: it.s.axis, line: it.s.c, at: (it.p.a + it.p.b) / 2, ...d, swing, ...extra })
    used.add(keyOf(it))
  }

  // doors between rooms: the longest shared piece of each requested pair
  const byPair = new Map()
  for (const it of all) {
    if (!it.p.neighbour) continue
    const k = pairKey(it.r.id, it.p.neighbour)
    if (doorPairs.has(k) && (!byPair.has(k) || byPair.get(k).len < it.len)) byPair.set(k, it)
  }
  for (const it of byPair.values()) if (it.len >= OPENING_DEFAULTS.door.w + 0.2) add(it, 'door')

  const exterior = all.filter((it) => !it.p.neighbour).sort((a, b) => b.len - a.len)
  for (const it of exterior) {
    const k = `${it.r.id}:${it.s.side}`
    if (entrances.has(k) && !used.has(keyOf(it)) && it.len >= OPENING_DEFAULTS.entrance.w + 0.3) {
      add(it, 'entrance')
      entrances.delete(k)
    }
  }
  const withWindow = new Set()
  for (const it of exterior) {
    if (used.has(keyOf(it)) || withWindow.has(it.r.id) || it.r.type === 'hall') continue
    const bath = it.r.type === 'bathroom'
    const w = bath ? 0.7 : Math.min(1.8, it.len - 0.9)
    if (w < 0.6) continue
    add(it, 'window', bath ? { w, sill: 1.6, h: 0.6 } : { w })
    withWindow.add(it.r.id)
  }
  return openings
}

/**
 * Turn a plan into renderable wall skins, door/window frames and corner posts.
 * Each skin: { key, group, x, z, len, axis, y0, y1, color, exterior, normal:[nx,nz] }
 */
export function buildWalls(plan) {
  const { rooms } = plan
  const openings = ensureOpenings(plan).openings
  const walls = wallPieces(rooms)
  const onPiece = new Map() // piece key -> openings sorted along the wall
  for (const op of openings) {
    const piece = pieceFor(op, walls)
    if (!piece) continue
    if (!onPiece.has(piece.key)) onPiece.set(piece.key, [])
    onPiece.get(piece.key).push(op)
  }
  for (const list of onPiece.values()) list.sort((a, b) => a.at - b.at)

  const skins = []
  const decor = []
  const seenDecor = new Set()
  for (const r of rooms) {
    for (const s of sides(r)) {
      for (const p of pieces(r, s, rooms)) {
        const k = `${s.axis}:${s.c.toFixed(3)}:${p.a.toFixed(3)}:${p.b.toFixed(3)}`
        const ops = onPiece.get(k) || []
        const ext = !p.neighbour
        const outward = [s.axis === 'z' ? -s.inward : 0, s.axis === 'x' ? -s.inward : 0]
        const emit = (side, color) => {
          // side: +1 = inner skin (inside r), -1 = outer skin
          const offset = s.c + s.inward * side * (WALL_T / 4)
          let n = 0
          const push = (a, b, y0, y1) => {
            if (b - a < EPS || y1 - y0 < EPS) return
            const mid = (a + b) / 2
            skins.push({
              key: `${r.id}:${k}:${side}:${n++}`,
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
            })
          }
          let cursor = p.a
          for (const op of ops) {
            const o0 = op.at - op.w / 2
            const o1 = op.at + op.w / 2
            push(cursor, o0, 0, WALL_H)
            if (op.type === 'window') {
              push(o0, o1, 0, op.sill)
              push(o0, o1, op.sill + op.h, WALL_H)
            } else {
              push(o0, o1, op.h, WALL_H)
            }
            cursor = o1
          }
          push(cursor, p.b, 0, WALL_H)
        }
        emit(1, r.wallColor)
        if (ext) emit(-1, EXTERIOR_COLOR)
        for (const op of ops) {
          if (seenDecor.has(op.id)) continue
          seenDecor.add(op.id)
          decor.push({
            ...op,
            key: op.id,
            group: k,
            x: s.axis === 'x' ? op.at : s.c,
            z: s.axis === 'x' ? s.c : op.at,
            exterior: ext,
            normal: outward,
            // swing doors into the room they belong to
            inward: op.swing ?? s.inward,
          })
        }
      }
    }
  }

  // corner posts fill the gaps where skins meet
  const posts = new Map()
  for (const r of rooms) {
    const { x0, x1, z0, z1 } = roomRect(r)
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) posts.set(`${x.toFixed(3)}:${z.toFixed(3)}`, { x, z })
  }

  return { skins, decor, posts: [...posts.values()] }
}

export const newOpeningId = () => newId('o')
export const newRoomId = () => newId('r')
