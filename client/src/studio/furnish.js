// Automatic furnishing: a sensible starting layout for each room type.
// Positions are fractions of the room (-0.5 … 0.5); the placement engine then
// pushes each piece against walls and around anything already placed.
import { evaluate, findFreeSpot, newUid } from './placement.js'

const PI = Math.PI
// [slug, fx, fz, rotation, options]   options.on = index of the host entry (small items)
const LAYOUTS = {
  living: [
    ['zawiya-rug', 0, 0.02, 0],
    ['chester-leather-sofa', 0, -0.5, 0],
    ['stone-coffee-table', 0, 0.02, PI / 2],
    ['nordic-lounge-chair', 0.36, 0.05, -PI / 2],
    ['slatted-tv-cabinet', 0, 0.5, PI],
    ['terracotta-plant', -0.5, -0.5, 0],
    ['air-cooler', 0.5, -0.5, 0],
    ['oak-side-table', -0.36, -0.42, 0],
    ['blue-china-vase', 0, 0, 0, { on: 2 }],
    ['oil-lamp', 0, 0, 0, { on: 7 }],
  ],
  guest: [
    ['zawiya-rug', 0, 0, 0],
    ['pasha-sofa', 0, -0.5, 0],
    ['orient-wood-sofa', -0.5, 0.05, PI / 2],
    ['tea-table', 0, 0.02, 0],
    ['glass-buffet', 0, 0.5, PI],
    ['aladdin-heater', 0.36, 0.2, 0],
    ['royal-armchair', 0.42, -0.1, -PI / 2],
    ['brass-pot', 0, 0, 0, { on: 3 }],
  ],
  kitchen: [
    ['kitchen-counter', 0, -0.5, 0],
    ['fridge', 0.5, -0.1, -PI / 2],
    ['gas-stove', -0.5, -0.05, PI / 2],
    ['round-bistro-table', 0, 0.22, 0],
    ['farmhouse-chair', -0.16, 0.22, PI / 2],
    ['farmhouse-chair', 0.16, 0.22, -PI / 2],
    ['brass-pot', 0.25, 0, 0, { on: 0 }],
    ['tiny-succulent', 0, 0, 0, { on: 3 }],
  ],
  bathroom: [
    ['bathtub', 0, -0.5, 0],
    ['toilet', 0.5, 0.3, -PI / 2],
    ['vanity', -0.5, 0.2, PI / 2],
    ['washing-machine', 0.5, -0.05, -PI / 2],
  ],
  bedroom: [
    ['four-poster-bed', 0, -0.5, 0],
    ['najaf-nightstand', -0.3, -0.5, 0],
    ['najaf-nightstand', 0.3, -0.5, 0],
    ['kantoor-wardrobe', 0, 0.5, PI],
    ['floor-fan', 0.5, 0.35, -PI / 2],
    ['farmhouse-dresser', -0.5, 0.15, PI / 2],
    ['table-lamp', 0, 0, 0, { on: 1 }],
    ['bell-alarm-clock', 0, 0, 0, { on: 2 }],
    ['white-fluted-vase', 0, 0, 0, { on: 5 }],
  ],
  kids: [
    ['iron-single-bed', -0.5, -0.5, 0],
    ['study-desk', 0.5, -0.5, 0],
    ['painted-bookcase', 0.5, 0.25, -PI / 2],
    ['basra-ottoman', 0, 0.2, 0],
    ['small-plant', 0, 0, 0, { on: 1 }],
  ],
  office: [
    ['metal-office-desk', 0, -0.5, 0],
    ['nordic-lounge-chair', 0.3, 0.25, PI],
    ['wide-bookshelf', 0, 0.5, PI],
    ['heart-leaf-plant', -0.5, 0.5, 0],
    ['tiny-succulent', 0, 0, 0, { on: 0 }],
    ['shelf-clock', 0.3, 0, 0, { on: 0 }],
  ],
  hall: [
    ['carved-console', -0.25, -0.5, 0],
    ['brass-floor-vase', -0.45, -0.5, 0],
    ['rocking-chair', 0.3, 0, -PI / 2],
    ['shelf-clock', 0, 0, 0, { on: 0 }],
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
