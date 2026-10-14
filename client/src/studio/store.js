import { create } from 'zustand'
import { extents, findFreeSpot, indexItems, newUid, worldOf } from './placement.js'
import { WALL_T, cleanOpenings, ensureOpenings, generatePlan, makePlan, planFromLegacyRoom, roomAt, roomRect } from './plan.js'
import { furnishPlan } from './furnish.js'

export const WALL_COLORS = ['#ece6dc', '#f5f1ea', '#d9cbb4', '#c9d3cf', '#b7c4cf', '#e3cfc0', '#8f9e8b', '#2f3e4e']
const AUTOSAVE_KEY = 'juman-studio-draft-v2'

/**
 * Live drag state. Lives outside React because it changes on every pointer
 * move; the 3D components read it inside useFrame.
 */
export const drag = {
  active: false,
  mode: null, // 'move' | 'new'
  uid: null,
  product: null,
  color: null,
  x: 0,
  z: 0,
  y: 0,
  rot: 0,
  valid: true,
  parent: null,
  local: null,
  roomId: null,
  offsetX: 0,
  offsetZ: 0,
  overCanvas: false,
  clientX: 0,
  clientY: 0,
  startX: 0,
  startZ: 0,
  startRot: 0,
}

/** uid -> { x, y, z } starting pose for items that should drop in from above. */
export const spawnPoses = new Map()

const snapshot = (s) => ({ items: s.items, plan: s.plan })
const NEW_NAME = 'تصميمي الجديد'

export const useStudio = create((set, get) => ({
  products: [],
  productMap: {},
  plan: makePlan('room'),
  activeRoom: null, // room the user is working in (settings panel, "add" button)
  items: [],
  selected: null,
  past: [],
  future: [],
  snap: true,
  night: false,
  quality: 'high',
  guides: true,
  walls: 'auto', // 'auto' | 'down' | 'up'
  draggingUid: null, // mirrors drag.uid for React UI (null when idle)
  newDragProduct: null, // product being dragged from the catalogue
  overCanvas: false,
  design: { id: null, name: NEW_NAME },
  dirty: false,
  cameraCmd: { name: 'persp', n: 0 },
  templatePicker: false,
  planEditor: false,

  setProducts: (products) =>
    set({ products, productMap: Object.fromEntries(products.map((p) => [p.id, p])) }),

  record: () => set((s) => ({ past: [...s.past.slice(-80), snapshot(s)], future: [], dirty: true })),

  undo: () =>
    set((s) => {
      if (!s.past.length) return {}
      const prev = s.past[s.past.length - 1]
      return { ...prev, past: s.past.slice(0, -1), future: [snapshot(s), ...s.future], selected: null, dirty: true }
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return {}
      const [next, ...rest] = s.future
      return { ...next, future: rest, past: [...s.past, snapshot(s)], selected: null, dirty: true }
    }),

  select: (uid) => set({ selected: uid }),

  addItem: (item, { record = true } = {}) => {
    if (record) get().record()
    set((s) => ({ items: [...s.items, item], selected: item.uid, dirty: true }))
  },

  /** Centre of the room the user is working in. */
  focusPoint: () => {
    const s = get()
    const room = s.plan.rooms.find((r) => r.id === s.activeRoom) || s.plan.rooms[0]
    return { x: room.x, z: room.z, roomId: room.id }
  },

  /** Adds a product at the first free spot near (x, z). Returns false if the room is full. */
  addProductNear: (product, x, z, color) => {
    const s = get()
    const focus = s.focusPoint()
    const roomId = x === undefined ? focus.roomId : undefined
    const spot = findFreeSpot(s, { uid: null, product, x: x ?? focus.x, z: z ?? focus.z, rot: 0, roomId })
    if (!spot) return false
    const uid = newUid()
    spawnPoses.set(uid, { x: spot.x, y: 0.9, z: spot.z })
    get().addItem({ uid, productId: product.id, x: spot.x, z: spot.z, rot: 0, color: color || product.colors[0], parent: null })
    return true
  },

  updateItem: (uid, patch, { record = true } = {}) => {
    if (record) get().record()
    set((s) => ({ items: s.items.map((it) => (it.uid === uid ? { ...it, ...patch } : it)), dirty: true }))
  },

  removeItem: (uid) => {
    if (!uid) return
    get().record()
    set((s) => ({
      items: s.items.filter((it) => it.uid !== uid && it.parent !== uid),
      selected: s.selected === uid ? null : s.selected,
      dirty: true,
    }))
  },

  duplicate: (uid) => {
    const s = get()
    const src = s.items.find((it) => it.uid === uid)
    if (!src) return
    const product = s.productMap[src.productId]
    const w = worldOf(src, indexItems(s.items), s.productMap)
    const roomId = roomAt(s.plan.rooms, w.x, w.z)?.id
    const spot = findFreeSpot(s, { uid: null, product, x: w.x + 0.3, z: w.z + 0.3, rot: w.rot, roomId })
    if (!spot) return
    const copy = { ...src, uid: newUid(), x: spot.x, z: spot.z, rot: spot.rot, parent: null }
    spawnPoses.set(copy.uid, { x: spot.x, y: 0.7, z: spot.z })
    get().addItem(copy)
  },

  rotateItem: (uid, delta) => {
    const it = get().items.find((i) => i.uid === uid)
    if (!it) return
    get().updateItem(uid, { rot: it.rot + delta })
  },

  updateRoom: (id, patch, { record = true } = {}) => {
    if (record) get().record()
    set((s) => ({
      plan: { ...s.plan, rooms: s.plan.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) },
      dirty: true,
    }))
  },

  setActiveRoom: (id) => set({ activeRoom: id }),

  /** Replace the plan (the plan editor works on whole plans). */
  setPlan: (plan, { record = true } = {}) => {
    if (record) get().record()
    set({ plan, dirty: true })
  },

  /** Move a room by (dx, dz) together with the furniture standing in it and the openings on its walls. */
  moveRoom: (id, dx, dz) =>
    set((s) => {
      const room = s.plan.rooms.find((r) => r.id === id)
      if (!room) return {}
      const { x0, x1, z0, z1 } = roomRect(room)
      const inside = (x, z) => x >= x0 - 1e-3 && x <= x1 + 1e-3 && z >= z0 - 1e-3 && z <= z1 + 1e-3
      const onEdge = (o) =>
        o.axis === 'x'
          ? (Math.abs(o.line - z0) < 1e-3 || Math.abs(o.line - z1) < 1e-3) && o.at >= x0 && o.at <= x1
          : (Math.abs(o.line - x0) < 1e-3 || Math.abs(o.line - x1) < 1e-3) && o.at >= z0 && o.at <= z1
      return {
        plan: {
          ...s.plan,
          rooms: s.plan.rooms.map((r) => (r.id === id ? { ...r, x: r.x + dx, z: r.z + dz } : r)),
          openings: (s.plan.openings || []).map((o) =>
            onEdge(o)
              ? { ...o, line: o.line + (o.axis === 'x' ? dz : dx), at: o.at + (o.axis === 'x' ? dx : dz) }
              : o,
          ),
        },
        items: s.items.map((it) => (!it.parent && inside(it.x, it.z) ? { ...it, x: it.x + dx, z: it.z + dz } : it)),
        dirty: true,
      }
    }),

  /** Delete a room, the furniture in it and any opening left hanging. */
  removeRoom: (id) => {
    const s = get()
    if (s.plan.rooms.length < 2) return
    s.record()
    const room = s.plan.rooms.find((r) => r.id === id)
    const { x0, x1, z0, z1 } = roomRect(room)
    const gone = new Set(
      s.items.filter((it) => !it.parent && it.x > x0 && it.x < x1 && it.z > z0 && it.z < z1).map((it) => it.uid),
    )
    const plan = cleanOpenings({ ...s.plan, rooms: s.plan.rooms.filter((r) => r.id !== id) })
    set({
      plan,
      items: s.items.filter((it) => !gone.has(it.uid) && !gone.has(it.parent)),
      activeRoom: s.activeRoom === id ? null : s.activeRoom,
      selected: null,
      dirty: true,
    })
  },

  /** After a room shrinks, pull every floor item back inside its room. */
  fitItemsToRooms: () =>
    set((s) => ({
      items: s.items.map((it) => {
        const p = s.productMap[it.productId]
        if (it.parent || !p) return it
        const room = roomAt(s.plan.rooms, it.x, it.z)
        const [ex, ez] = extents(p.dims.w / 2, p.dims.d / 2, it.rot)
        const i = WALL_T / 2
        const cx = Math.max(room.x - room.width / 2 + i + ex, Math.min(room.x + room.width / 2 - i - ex, it.x))
        const cz = Math.max(room.z - room.depth / 2 + i + ez, Math.min(room.z + room.depth / 2 - i - ez, it.z))
        return cx === it.x && cz === it.z ? it : { ...it, x: cx, z: cz }
      }),
    })),

  setOption: (key, value) => set({ [key]: value }),
  camera: (name, roomId) => set((s) => ({ cameraCmd: { name, roomId, n: s.cameraCmd.n + 1 } })),

  clearAll: () => {
    get().record()
    set({ items: [], selected: null, dirty: true })
  },

  loadDesign: (design) =>
    set({
      plan: design.plan ? ensureOpenings(design.plan) : design.room ? planFromLegacyRoom(design.room) : makePlan('room'),
      items: design.items || [],
      design: { id: design.id ?? null, name: design.name || NEW_NAME },
      past: [],
      future: [],
      selected: null,
      activeRoom: null,
      dirty: false,
      cameraCmd: { name: 'persp', n: get().cameraCmd.n + 1 },
    }),

  /** Start from a template; optionally furnish every room automatically. */
  newDesign: (template = 'room', { furnished = false, rooms: counts } = {}) => {
    const plan = template === 'custom' ? generatePlan(counts) : makePlan(template)
    let items = []
    if (furnished && get().products.length) {
      const s = get()
      items = furnishPlan(plan, s.products, s.productMap)
      items.forEach((it, i) => !it.parent && spawnPoses.set(it.uid, { x: it.x, y: 1.2 + (i % 5) * 0.25, z: it.z }))
    }
    set((s) => ({
      plan,
      items,
      design: { id: null, name: NEW_NAME },
      past: [],
      future: [],
      selected: null,
      activeRoom: null,
      dirty: items.length > 0,
      templatePicker: false,
      cameraCmd: { name: 'persp', n: s.cameraCmd.n + 1 },
    }))
  },

  setDesignMeta: (meta) => set((s) => ({ design: { ...s.design, ...meta }, dirty: false })),
  renameDesign: (name) => set((s) => ({ design: { ...s.design, name }, dirty: true })),
}))

// Keep an unsaved draft per browser so a refresh never loses work.
export function restoreDraft() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return false
    const draft = JSON.parse(raw)
    if (!Array.isArray(draft.items) || !draft.plan?.rooms?.length) return false
    useStudio.getState().loadDesign(draft)
    useStudio.setState({ dirty: Boolean(draft.dirty) })
    return true
  } catch {
    return false
  }
}

let autosaveTimer
useStudio.subscribe((s, prev) => {
  if (s.items === prev.items && s.plan === prev.plan && s.design === prev.design) return
  clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({ id: s.design.id, name: s.design.name, plan: s.plan, items: s.items, dirty: s.dirty }),
      )
    } catch {
      /* storage unavailable – ignore */
    }
  }, 400)
})

