// Pure placement maths for the studio: oriented-rectangle collisions (SAT),
// room clamping, wall snapping and stacking small items on surfaces.
// Coordinates: metres, floor is the XZ plane, rotation is around +Y (three.js convention).
import { WALL_T, roomAt } from './plan.js'

export const LIFT = 0.32 // how high an item floats while it is being dragged
export const GRID = 0.05
const WALL_SNAP = 0.1
const EPS = 0.004

const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)))
const INSET = WALL_T / 2 // walls sit on the room edges, half their thickness inside

/** Rotate a local (x, z) offset by `a` radians around Y. */
export function rotateXZ(x, z, a) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [x * c + z * s, -x * s + z * c]
}

export function rectOf(product, x, z, rot) {
  return { x, z, rot, hw: product.dims.w / 2, hd: product.dims.d / 2 }
}

/** Half extents of the axis-aligned box that contains a rotated rectangle. */
export function extents(hw, hd, rot) {
  const c = Math.abs(Math.cos(rot))
  const s = Math.abs(Math.sin(rot))
  return [hw * c + hd * s, hw * s + hd * c]
}

function axes(r) {
  const c = Math.cos(r.rot)
  const s = Math.sin(r.rot)
  return [
    [c, -s], // local x
    [s, c], // local z
  ]
}

function project(r, [ax, az]) {
  const [ux, uz] = axes(r)
  const center = r.x * ax + r.z * az
  const radius = r.hw * Math.abs(ux[0] * ax + ux[1] * az) + r.hd * Math.abs(uz[0] * ax + uz[1] * az)
  return [center - radius, center + radius]
}

/** Separating-axis test for two oriented rectangles. */
export function overlaps(a, b) {
  for (const axis of [...axes(a), ...axes(b)]) {
    const [a0, a1] = project(a, axis)
    const [b0, b1] = project(b, axis)
    if (a1 - EPS <= b0 || b1 - EPS <= a0) return false
  }
  return true
}

export function indexItems(items) {
  const byUid = {}
  for (const it of items) byUid[it.uid] = it
  return byUid
}

/** World transform of an item (resolves items that sit on another item). */
export function worldOf(item, byUid, productMap) {
  if (!item.parent || !byUid[item.parent]) return { x: item.x, z: item.z, rot: item.rot, y: 0 }
  const host = byUid[item.parent]
  const [dx, dz] = rotateXZ(item.x, item.z, host.rot)
  return {
    x: host.x + dx,
    z: host.z + dz,
    rot: host.rot + item.rot,
    y: productMap[host.productId]?.surfaceHeight || 0,
  }
}

/** Is world point (px, pz) inside rectangle r (grown by `pad`)? */
export function pointInRect(px, pz, r, pad = 0) {
  const [lx, lz] = rotateXZ(px - r.x, pz - r.z, -r.rot)
  return Math.abs(lx) <= r.hw + pad && Math.abs(lz) <= r.hd + pad
}

/** Items that can carry small items on top. */
export function hostsOf(items, productMap, excludeUid) {
  return items.filter((it) => !it.parent && it.uid !== excludeUid && productMap[it.productId]?.surfaceHeight)
}

/**
 * Work out where an item would land and whether that spot is free.
 * Returns { valid, x, z, rot, y, parent, local } (local = coords relative to the host).
 */
export function evaluate(ctx, { uid, product, x, z, rot, hostUid, roomId }) {
  // ctx is either the studio store state (has plan.rooms) or a plain { items, productMap, rooms }
  const { items, productMap, snap } = ctx
  const rooms = ctx.rooms || ctx.plan.rooms
  const byUid = indexItems(items)

  if (hostUid && byUid[hostUid] && product.kind === 'small') {
    const host = byUid[hostUid]
    const hostProduct = productMap[host.productId]
    let [lx, lz] = rotateXZ(x - host.x, z - host.z, -host.rot)
    const relRot = rot - host.rot
    const [ex, ez] = extents(product.dims.w / 2, product.dims.d / 2, relRot)
    lx = clamp(lx, -hostProduct.dims.w / 2 + ex + 0.01, hostProduct.dims.w / 2 - ex - 0.01)
    lz = clamp(lz, -hostProduct.dims.d / 2 + ez + 0.01, hostProduct.dims.d / 2 - ez - 0.01)
    const [dx, dz] = rotateXZ(lx, lz, host.rot)
    const wx = host.x + dx
    const wz = host.z + dz
    const me = rectOf(product, wx, wz, rot)
    const valid = items
      .filter((it) => it.parent === hostUid && it.uid !== uid)
      .every((it) => {
        const w = worldOf(it, byUid, productMap)
        return !overlaps(me, rectOf(productMap[it.productId], w.x, w.z, w.rot))
      })
    return {
      valid,
      x: wx,
      z: wz,
      rot,
      y: hostProduct.surfaceHeight,
      parent: hostUid,
      local: { x: lx, z: lz, rot: relRot },
    }
  }

  // Floor placement: the item stays inside one room (the one under the pointer).
  const room = (roomId && rooms.find((r) => r.id === roomId)) || roomAt(rooms, x, z)
  if (snap) {
    x = Math.round(x / GRID) * GRID
    z = Math.round(z / GRID) * GRID
  }
  const [ex, ez] = extents(product.dims.w / 2, product.dims.d / 2, rot)
  const minX = room.x - room.width / 2 + INSET + ex
  const maxX = room.x + room.width / 2 - INSET - ex
  const minZ = room.z - room.depth / 2 + INSET + ez
  const maxZ = room.z + room.depth / 2 - INSET - ez
  x = clamp(x, minX, maxX)
  z = clamp(z, minZ, maxZ)
  if (snap) {
    // Pull things flush against a wall when they get close — like pushing furniture to the wall.
    if (x - minX < WALL_SNAP) x = minX
    if (maxX - x < WALL_SNAP) x = maxX
    if (z - minZ < WALL_SNAP) z = minZ
    if (maxZ - z < WALL_SNAP) z = maxZ
  }

  if (product.kind === 'rug') return { valid: true, x, z, rot, y: 0, parent: null, local: null, roomId: room.id }

  const me = rectOf(product, x, z, rot)
  const valid = items.every((it) => {
    if (it.uid === uid || it.parent) return true
    const p = productMap[it.productId]
    if (!p || p.kind === 'rug') return true
    return !overlaps(me, rectOf(p, it.x, it.z, it.rot))
  })
  return { valid, x, z, rot, y: 0, parent: null, local: null, roomId: room.id }
}

/** Spiral outwards from (x, z) until a free floor spot is found. */
export function findFreeSpot(ctx, { uid, product, x, z, rot, roomId }, maxRadius = 3) {
  const first = evaluate({ ...ctx, snap: false }, { uid, product, x, z, rot, roomId })
  if (first.valid) return first
  const step = 0.12
  for (let r = step; r <= maxRadius; r += step) {
    const n = Math.max(8, Math.round((2 * Math.PI * r) / step))
    let best = null
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const res = evaluate({ ...ctx, snap: false }, { uid, product, x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, rot, roomId })
      if (res.valid) {
        const d = (res.x - x) ** 2 + (res.z - z) ** 2
        if (!best || d < best.d) best = { ...res, d }
      }
    }
    if (best) return best
  }
  return null
}

/** Shortest signed difference between two angles. */
export function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

let counter = 0
export const newUid = () => `i${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`
