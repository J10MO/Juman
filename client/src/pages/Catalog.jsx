import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon.jsx'
import { ProductCard } from '../components/ProductCard.jsx'
import { ErrorState, Loading } from '../components/States.jsx'
import { useApi } from '../lib/useApi.js'
import { formatNumber } from '../lib/format.js'

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || ''
  const source = params.get('source') || ''
  const [q, setQ] = useState(params.get('q') || '')
  const [debounced, setDebounced] = useState(q)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const qs = new URLSearchParams()
  if (category) qs.set('category', category)
  if (source) qs.set('source', source)
  if (debounced) qs.set('q', debounced)
  const products = useApi(`/products${qs.toString() ? `?${qs}` : ''}`)
  const cats = useApi('/categories')

  const setCategory = (slug) => {
    const next = new URLSearchParams(params)
    slug ? next.set('category', slug) : next.delete('category')
    setParams(next, { replace: true })
  }

  const total = cats.data?.categories.reduce((n, c) => n + c.productCount, 0)

  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow">الموبيليا</span>
        <h1>كل شي تحتاجه للبيت</h1>
        <p className="muted">كل قطعة هنا مجسّم 3D بالقياس الحقيقي. اختار لونها، وبضغطة وحدة تجربها بالاستوديو.</p>
      </div>

      <div className="filters">
        <button
          className={`filter-chip ${source === 'scan' ? 'active' : ''}`}
          onClick={() => {
            const next = new URLSearchParams(params)
            source === 'scan' ? next.delete('source') : next.set('source', 'scan')
            setParams(next, { replace: true })
          }}
        >
          ✦ حقيقي 3D
        </button>
        <button className={`filter-chip ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>
          الكل {total ? <small>{formatNumber(total)}</small> : null}
        </button>
        {cats.data?.categories.map((c) => (
          <button
            key={c.slug}
            className={`filter-chip ${category === c.slug ? 'active' : ''}`}
            onClick={() => setCategory(c.slug)}
          >
            {c.name} <small>{formatNumber(c.productCount)}</small>
          </button>
        ))}
        <label className="search">
          <Icon name="search" size={18} />
          <input className="input" placeholder="دوّر على قطعة..." value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      {products.loading && !products.data && <Loading />}
      {products.error && <ErrorState error={products.error} onRetry={products.reload} />}
      {products.data &&
        (products.data.products.length ? (
          <div className="grid" style={{ opacity: products.loading ? 0.6 : 1, transition: 'opacity .2s' }}>
            {products.data.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>ماكو شي بهذا الاسم 🤔</h3>
            <p className="muted">جرّب كلمة ثانية أو اختار قسم ثاني.</p>
          </div>
        ))}
    </div>
  )
}
