import { create } from 'zustand'

const KEY = 'juman-cart-v1'

const load = () => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { lines: Array.isArray(d.lines) ? d.lines : [], designId: d.designId ?? null }
  } catch {
    return { lines: [], designId: null }
  }
}

// Keep just what the cart page needs to show a line; the server re-prices every order.
const snapshot = (p) => ({
  id: p.id, slug: p.slug, name: p.name, price: p.price, imageUrl: p.imageUrl, modelUrl: p.modelUrl,
  modelKey: p.modelKey, colors: p.colors, dims: p.dims, kind: p.kind, categoryName: p.categoryName,
})

export const useCart = create((set) => ({
  ...load(),
  add: (product, color, qty = 1) =>
    set((s) => {
      const c = color || product.colors[0]
      const found = s.lines.find((l) => l.productId === product.id && l.color === c)
      return {
        lines: found
          ? s.lines.map((l) => (l === found ? { ...l, qty: Math.min(50, l.qty + qty) } : l))
          : [...s.lines, { productId: product.id, color: c, qty, product: snapshot(product) }],
      }
    }),
  /** Put every piece of a design in the cart (grouped by product + colour). */
  addDesign: (items, productMap, designId) =>
    set((s) => {
      let lines = [...s.lines]
      for (const it of items) {
        const p = productMap[it.productId]
        if (!p) continue
        const i = lines.findIndex((l) => l.productId === p.id && l.color === it.color)
        if (i >= 0) lines[i] = { ...lines[i], qty: Math.min(50, lines[i].qty + 1) }
        else lines = [...lines, { productId: p.id, color: it.color, qty: 1, product: snapshot(p) }]
      }
      return { lines, designId: designId ?? s.designId }
    }),
  setQty: (productId, color, qty) =>
    set((s) => ({
      lines:
        qty <= 0
          ? s.lines.filter((l) => !(l.productId === productId && l.color === color))
          : s.lines.map((l) => (l.productId === productId && l.color === color ? { ...l, qty: Math.min(50, qty) } : l)),
    })),
  clear: () => set({ lines: [], designId: null }),
}))

useCart.subscribe((s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ lines: s.lines, designId: s.designId }))
  } catch {
    /* ignore */
  }
})

export const cartCount = (s) => s.lines.reduce((n, l) => n + l.qty, 0)
export const cartTotal = (s) => s.lines.reduce((n, l) => n + l.qty * l.product.price, 0)
