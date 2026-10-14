// Automatic furnishing: a sensible starting layout for each room type.
// Positions are fractions of the room (-0.5 … 0.5); the placement engine then
// pushes each piece against walls and around anything already placed.
import { evaluate, findFreeSpot, newUid } from './placement.js'

const PI = Math.PI
// [slug, fx, fz, rotation, options]   options.on = index of the host entry (small items)
const LAYOUTS = {
  living: [
    ['moroccan-rug', 0, 0.02, 0],
    ['nuvola-sofa', 0, -0.5, 0],
    ['marble-coffee-table', 0, 0.02, 0],
    ['luna-chair', 0.36, 0.05, -PI / 2],
    ['fluted-tv-wall', 0, 0.5, PI],
    ['arc-floor-lamp', -0.42, -0.42, 0],
    ['terracotta-plant', 0.5, -0.5, 0],
    ['air-cooler', -0.5, 0.45, PI / 2],
    ['clay-modern-vase', 0.2, 0, 0, { on: 2 }],
    ['cloud-pouf', -0.3, 0.12, 0],
    ['game-console', 0.5, 0, 0, { on: 4 }],
  ],
  guest: [
    ['tabriz-rug', 0.05, 0.05, 0],
    ['corner-sectional', -0.1, -0.5, 0],
    ['nesting-stone-tables', 0.05, 0.05, 0],
    ['fluted-sideboard', 0, 0.5, PI],
    ['nordic-lounge-chair', 0.42, 0.05, -PI / 2],
    ['aladdin-heater', 0.42, -0.42, 0],
    ['tea-set', 0, 0, 0, { on: 2 }],
    ['brass-lantern', -0.3, 0, 0, { on: 3 }],
    ['heart-leaf-plant', -0.5, 0.5, 0],
  ],
  kitchen: [
    ['kitchen-counter', 0, -0.5, 0],
    ['fridge', 0.5, -0.1, -PI / 2],
    ['gas-stove', -0.5, -0.05, PI / 2],
    ['waterfall-island', 0, 0.12, 0],
    ['counter-stool', -0.12, 0.42, PI],
    ['counter-stool', 0.12, 0.42, PI],
    ['wicker-basket', 0.2, 0, 0, { on: 3 }],
    ['wooden-bowl', -0.2, 0, 0, { on: 3 }],
    ['display-shelves', -0.5, 0.45, PI / 2],
    ['clay-jug', 0, 0, 0, { on: 8 }],
  ],
  bathroom: [
    ['bathtub', 0, -0.5, 0],
    ['toilet', 0.5, 0.3, -PI / 2],
    ['vanity', -0.5, 0.2, PI / 2],
    ['washing-machine', 0.5, -0.05, -PI / 2],
    ['bath-mat', 0, -0.1, 0],
  ],
  bedroom: [
    ['shaggy-rug', 0, 0.1, 0],
    ['linen-platform-bed', 0, -0.5, 0],
    ['oak-nightstand', -0.33, -0.5, 0],
    ['oak-nightstand', 0.33, -0.5, 0],
    ['sliding-wardrobe', 0.1, 0.5, PI],
    ['arch-mirror', -0.5, 0.25, PI / 2],
    ['floor-fan', 0.5, 0.35, -PI / 2],
    ['table-lamp', 0, 0, 0, { on: 2 }],
    ['photo-frame', 0, 0, 0, { on: 3 }],
  ],
  kids: [
    ['kids-rug', 0, 0.1, 0],
    ['linen-platform-bed', -0.5, -0.5, 0],
    ['oak-sled-desk', 0.5, -0.5, 0],
    ['ergo-chair', 0.5, -0.2, PI],
    ['open-shelf', 0.5, 0.35, -PI / 2],
    ['cloud-pouf', -0.1, 0.35, 0],
    ['small-plant', 0.3, 0, 0, { on: 2 }],
  ],
  office: [
    ['oak-sled-desk', 0, -0.5, 0],
    ['ergo-chair', 0, -0.15, PI],
    ['steel-oak-shelves', 0, 0.5, PI],
    ['luna-chair', -0.4, 0.15, PI / 2],
    ['heart-leaf-plant', 0.5, 0.15, 0],
    ['encyclopedia', -0.3, 0, 0, { on: 0 }],
    ['slim-vase', 0.35, 0, 0, { on: 0 }],
  ],
  hall: [
    ['hall-runner', 0, 0, 0],
    ['fluted-sideboard', -0.25, -0.5, 0],
    ['arch-mirror', 0.2, -0.5, 0],
    ['round-vase', 0, 0, 0, { on: 1 }],
    ['terracotta-plant', 0.45, 0.5, 0],
  ],
}

export function furnishPlan(plan, products) {
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]))
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))
  const items = []
  const ctx = { items, productMap, rooms: plan.rooms, snap: true }

  for (const room of plan.rooms) {
    const layout = LAYOUTS[room.type] || []
    const placed = [] // uid per layout entry (for hosts)
    layout.forEach(([slug, fx, fz, rot, opts = {}], idx) => {
      const product = bySlug[slug]
      if (!product) return
      const color = product.colors[0]

      if (opts.on !== undefined) {
        const hostUid = placed[opts.on]
        const host = items.find((i) => i.uid === hostUid)
        if (!host) return
        const res = evaluate(ctx, {
          uid: null, product, x: host.x + fx * 0.5, z: host.z + fz * 0.5, rot: host.rot + rot, hostUid,
        })
        if (!res.valid) return
        const uid = newUid()
        items.push({ uid, productId: product.id, x: res.local.x, z: res.local.z, rot: res.local.rot, color, parent: hostUid })
        placed[idx] = uid
        return
      }

      const x = room.x + fx * room.width
      const z = room.z + fz * room.depth
      let res = evaluate(ctx, { uid: null, product, x, z, rot, roomId: room.id })
      if (!res.valid) res = findFreeSpot(ctx, { uid: null, product, x, z, rot, roomId: room.id }, 2.5)
      if (!res) return
      const uid = newUid()
      items.push({ uid, productId: product.id, x: res.x, z: res.z, rot, color, parent: null })
      placed[idx] = uid
    })
  }
  return items
}
