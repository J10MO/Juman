import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../lib/cart.js'
import { useToast } from '../components/Toast.jsx'
import { ModelThumb } from '../components/ProductCard.jsx'
import { Icon } from '../components/Icon.jsx'
import { formatNumber, formatPrice } from '../lib/format.js'
import { dragApi } from './dragApi.js'
import { useStudio } from './store.js'
import { useThumbnail } from '../three/thumbnails.jsx'

const KIND_LABEL = { small: 'فوگ الميز', rug: 'فرشة' }

function Piece({ product }) {
  return (
    <div
      className="piece"
      role="button"
      tabIndex={0}
      title={`${product.name} — اسحبها للغرفة أو اضغط عليها`}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        dragApi.pressProduct(product, e.nativeEvent)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          useStudio.getState().addProductNear(product)
        }
      }}
    >
      <div className="piece-media">
        <ModelThumb product={product} />
        {KIND_LABEL[product.kind] && <span className="piece-kind">{KIND_LABEL[product.kind]}</span>}
        {product.modelUrl && <span className="piece-scan" title="مسح حقيقي 3D">3D</span>}
      </div>
      <div className="piece-name">{product.name}</div>
      <div className="piece-price">{formatPrice(product.price)}</div>
    </div>
  )
}

export function Sidebar() {
  const products = useStudio((s) => s.products)
  const items = useStudio((s) => s.items)
  const productMap = useStudio((s) => s.productMap)
  const dragging = useStudio((s) => s.draggingUid === 'new')
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const design = useStudio((s) => s.design)
  const addDesign = useCart((s) => s.addDesign)
  const navigate = useNavigate()
  const toast = useToast()

  // On phones the sheet gets out of the way once a drag starts or a piece is added.
  useEffect(() => {
    if (dragging) setOpen(false)
  }, [dragging])
  const count = items.length
  const prevCount = useRef(count)
  useEffect(() => {
    if (count > prevCount.current) setOpen(false)
    prevCount.current = count
  }, [count])

  // Once a card is picked up with a long-press, stop the list from scrolling under the finger.
  const listRef = useRef(null)
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const block = (e) => dragApi.isHolding() && e.cancelable && e.preventDefault()
    el.addEventListener('touchmove', block, { passive: false })
    return () => el.removeEventListener('touchmove', block)
  }, [])

  const tabs = useMemo(() => {
    const seen = new Map()
    products.forEach((p) => seen.set(p.categorySlug, p.categoryName))
    return [['all', 'الكل'], ['scan', 'حقيقي 3D'], ...seen.entries()]
  }, [products])

  const needle = q.trim()
  const list = products.filter(
    (p) =>
      (tab === 'all' || (tab === 'scan' ? p.modelUrl : p.categorySlug === tab)) &&
      (!needle || p.name.includes(needle) || p.categoryName?.includes(needle) || p.material?.includes(needle)),
  )
  const total = items.reduce((n, it) => n + (productMap[it.productId]?.price || 0), 0)

  return (
    <aside className={`studio-side ${open ? 'open' : ''}`}>
      <button className="side-toggle" onClick={() => setOpen((o) => !o)}>
        <Icon name={open ? 'close' : 'layers'} size={18} />
        {open ? 'سد القائمة' : 'الموبيليا — اسحب وذب'}
      </button>
      <div className="side-head">
        <h2>الموبيليا</h2>
        <p>اسحب أي قطعة وذبها بالغرفة، أو اضغط عليها وتنحط وحدها.</p>
        <p className="touch-hint">اضغط مرة وحدة حتى تنضاف، أو اضغط مطوّلاً واسحبها للمكان اللي تريده.</p>
        <label className="search side-search">
          <Icon name="search" size={16} />
          <input className="input" placeholder={`دوّر بين ${formatNumber(products.length)} قطعة...`} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="side-tabs">
          {tabs.map(([slug, name]) => (
            <button key={slug} className={tab === slug ? 'active' : ''} onClick={() => setTab(slug)}>
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="side-list" ref={listRef}>
        {list.map((p) => (
          <Piece key={p.id} product={p} />
        ))}
        {!list.length && <p className="muted side-empty">ماكو قطعة بهذا الاسم</p>}
      </div>
      <div className="side-foot">
        <div className="total-row">
          <span className="muted">{formatNumber(items.length)} قطعة بالتصميم</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <button
          className="btn btn-sm btn-gold"
          style={{ width: '100%', marginTop: 8 }}
          disabled={!items.length}
          onClick={() => {
            addDesign(items, productMap, design.id)
            toast(`انضافت ${formatNumber(items.length)} قطعة للسلة`)
            navigate('/cart')
          }}
        >
          <Icon name="cart" size={16} />
          اطلب كل قطع التصميم
        </button>
      </div>
    </aside>
  )
}

/** Card that follows the cursor while a product is dragged outside the 3D room. */
export function DragChip() {
  const product = useStudio((s) => s.newDragProduct)
  const over = useStudio((s) => s.overCanvas)
  const [pos, setPos] = useState(null)
  const thumb = useThumbnail(product)

  useEffect(() => {
    if (!product) return setPos(null)
    const move = (e) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [product])

  if (!product || over || !pos) return null
  return (
    <div className="drag-chip" style={{ left: pos.x, top: pos.y }}>
      {thumb && <img src={thumb} alt="" />}
      <span>{product.name}</span>
    </div>
  )
}
