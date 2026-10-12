import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon.jsx'
import { ModelThumb } from '../components/ProductCard.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { cartCount, cartTotal, useCart } from '../lib/cart.js'
import { colorName, formatNumber, formatPrice } from '../lib/format.js'
import { useApi } from '../lib/useApi.js'

function Line({ line }) {
  const setQty = useCart((s) => s.setQty)
  const { product: p, color, qty } = line
  return (
    <div className="cart-line">
      <Link to={`/product/${p.slug}`} className="cart-thumb">
        <ModelThumb product={p} color={color} />
      </Link>
      <div className="cart-info">
        <Link to={`/product/${p.slug}`} className="cart-name">
          {p.name}
        </Link>
        <span className="muted">
          {p.categoryName} · {colorName(color)}
          {color !== 'natural' && <span className="dot" style={{ background: color }} />}
        </span>
        <span className="price">{formatPrice(p.price)}</span>
      </div>
      <div className="qty">
        <button className="icon-btn" aria-label="زيد وحدة" onClick={() => setQty(p.id, color, qty + 1)}>
          <Icon name="plus" size={16} />
        </button>
        <span>{formatNumber(qty)}</span>
        <button className="icon-btn" aria-label="نقّص وحدة" onClick={() => setQty(p.id, color, qty - 1)}>
          <Icon name={qty === 1 ? 'trash' : 'minus'} size={16} />
        </button>
      </div>
      <strong className="cart-sum">{formatPrice(p.price * qty)}</strong>
    </div>
  )
}

export default function Cart() {
  const lines = useCart((s) => s.lines)
  const designId = useCart((s) => s.designId)
  const count = useCart(cartCount)
  const subtotal = useCart(cartTotal)
  const clear = useCart((s) => s.clear)
  const { user } = useAuth()
  const toast = useToast()
  const gov = useApi('/orders/governorates')
  const [form, setForm] = useState({ name: user?.name || '', phone: '', governorate: 'بغداد', address: '', notes: '' })
  const [state, setState] = useState({ loading: false, error: null, done: null })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const delivery = form.governorate === 'بغداد' ? 0 : gov.data?.deliveryFee ?? 15000

  const submit = async (e) => {
    e.preventDefault()
    setState({ loading: true, error: null, done: null })
    try {
      const d = await api('/orders', {
        method: 'POST',
        body: {
          ...form,
          phone: form.phone.replace(/[\s-]/g, ''),
          designId: designId || null,
          items: lines.map((l) => ({ productId: l.productId, qty: l.qty, color: l.color })),
        },
      })
      setState({ loading: false, error: null, done: d })
      clear()
      toast('وصل طلبك 🎉')
    } catch (err) {
      setState({ loading: false, error: err.message, done: null })
    }
  }

  if (state.done) {
    const o = state.done.order
    return (
      <div className="container">
        <div className="order-done">
          <div className="done-icon">
            <Icon name="check" size={36} stroke={2.4} />
          </div>
          <h1>تم الطلب! رقم طلبك #{formatNumber(o.id)}</h1>
          <p className="muted">{state.done.message}</p>
          <div className="order-summary">
            {o.items.map((l) => (
              <div key={l.productId + l.color} className="total-row">
                <span>
                  {l.name} × {formatNumber(l.qty)}
                </span>
                <span>{formatPrice(l.price * l.qty)}</span>
              </div>
            ))}
            <div className="total-row muted">
              <span>التوصيل</span>
              <span>{o.delivery ? formatPrice(o.delivery) : 'مجاناً'}</span>
            </div>
            <div className="total-row grand">
              <span>المجموع</span>
              <strong>{formatPrice(o.total)}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/catalog" className="btn">
              كمّل تسوّق
            </Link>
            {user && (
              <Link to="/designs" className="btn btn-ghost">
                طلباتي وتصاميمي
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!lines.length) {
    return (
      <div className="container">
        <div className="page-head">
          <h1>السلة</h1>
        </div>
        <div className="empty">
          <h3>السلة فارغة 🛒</h3>
          <p className="muted">تفرّج على الموبيليا، أو صمّم بيتك بالاستوديو واطلب كل القطع بضغطة وحدة.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link to="/catalog" className="btn">
              الموبيليا
            </Link>
            <Link to="/studio" className="btn btn-ghost">
              الاستوديو
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow">طلبك</span>
        <h1>السلة ({formatNumber(count)} قطعة)</h1>
        {designId && <p className="muted">هاي القطع من تصميمك بالاستوديو.</p>}
      </div>
      <div className="cart-grid">
        <div className="cart-lines">
          {lines.map((l) => (
            <Line key={`${l.productId}:${l.color}`} line={l} />
          ))}
          <button className="btn btn-ghost btn-sm" onClick={clear} style={{ alignSelf: 'flex-start' }}>
            <Icon name="trash" size={16} />
            فرّغ السلة
          </button>
        </div>

        <form className="checkout" onSubmit={submit}>
          <h3>معلومات التوصيل</h3>
          {state.error && <div className="form-error">{state.error}</div>}
          <div className="field">
            <label htmlFor="c-name">الاسم الكامل</label>
            <input id="c-name" className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div className="field">
            <label htmlFor="c-phone">رقم الموبايل</label>
            <input id="c-phone" className="input" dir="ltr" inputMode="tel" placeholder="07XX XXX XXXX"
              value={form.phone} onChange={set('phone')} required />
          </div>
          <div className="field">
            <label htmlFor="c-gov">المحافظة</label>
            <select id="c-gov" className="select" value={form.governorate} onChange={set('governorate')}>
              {(gov.data?.governorates || ['بغداد']).map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="c-addr">العنوان</label>
            <textarea id="c-addr" className="textarea" style={{ minHeight: 80 }}
              placeholder="المنطقة، المحلة، الزقاق، الدار، وأقرب نقطة دالة"
              value={form.address} onChange={set('address')} required />
          </div>
          <div className="field">
            <label htmlFor="c-notes">ملاحظات (اختياري)</label>
            <input id="c-notes" className="input" placeholder="مثلاً: اتصلوا قبل لا توصلون بساعة"
              value={form.notes} onChange={set('notes')} />
          </div>

          <div className="order-summary">
            <div className="total-row">
              <span>المجموع</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="total-row">
              <span>التوصيل والنصب</span>
              <span>{delivery ? formatPrice(delivery) : 'مجاناً ببغداد'}</span>
            </div>
            <div className="total-row grand">
              <span>الكلي</span>
              <strong>{formatPrice(subtotal + delivery)}</strong>
            </div>
          </div>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            <Icon name="shield" size={14} /> الدفع عند الاستلام. ما تدفع ولا دينار قبل ما توصلك القطع وتشوفها.
          </p>
          <button className="btn btn-gold btn-lg" style={{ width: '100%' }} disabled={state.loading}>
            {state.loading ? 'دا نرسل الطلب...' : `أكّد الطلب — ${formatPrice(subtotal + delivery)}`}
          </button>
        </form>
      </div>
    </div>
  )
}
