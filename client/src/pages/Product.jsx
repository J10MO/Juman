import { Suspense, lazy, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon.jsx'
import { AddToCart, ProductCard, Swatches } from '../components/ProductCard.jsx'
import { ErrorState, Loading } from '../components/States.jsx'
import { useApi } from '../lib/useApi.js'
import { colorName, formatDims, formatPrice } from '../lib/format.js'

const ModelViewer = lazy(() => import('../components/ModelViewer.jsx').then((m) => ({ default: m.ModelViewer })))

const KIND = {
  floor: 'تنحط على القاع',
  rug: 'تنفرش جوة الموبيليا',
  small: 'تنحط فوگ الميزات والرفوف',
}
// The 'kind' row reads better with a hint that tables can carry things.
const kindLabel = (p) => (p.surfaceHeight ? `${KIND[p.kind]}، وتگدر تحط أغراض فوگها` : KIND[p.kind])

export default function Product() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useApi(`/products/${slug}`)
  const [color, setColor] = useState(null)
  const [lit, setLit] = useState(false)
  const [spin, setSpin] = useState(true)
  const [view, setView] = useState('3d')

  const product = data?.product
  useEffect(() => {
    setColor(product?.colors[0] ?? null)
    setView('3d')
  }, [product])

  if (loading && !data) return <Loading />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!product || !color) return null

  return (
    <div className="container">
      <div className="product">
        <div>
          <div className="viewer">
            {view === 'photo' && product.imageUrl ? (
              <img className="viewer-photo" src={product.imageUrl} alt={product.name} />
            ) : (
              <Suspense fallback={<div className="shimmer" />}>
                <ModelViewer product={product} color={color} lit={lit} autoRotate={spin} />
              </Suspense>
            )}
            {product.imageUrl && (
              <div className="viewer-tabs">
                <button className={view === '3d' ? 'active' : ''} onClick={() => setView('3d')}>
                  <Icon name="cube" size={16} /> 3D
                </button>
                <button className={view === 'photo' ? 'active' : ''} onClick={() => setView('photo')}>
                  <Icon name="camera" size={16} /> صورة
                </button>
              </div>
            )}
            <div className="viewer-tools">
              <button className={`icon-btn ${lit ? 'active' : ''}`} data-tip={lit ? 'نهار' : 'شوفها بالليل'} onClick={() => setLit((l) => !l)}>
                <Icon name={lit ? 'sun' : 'moon'} size={18} />
              </button>
              <button className={`icon-btn ${spin ? 'active' : ''}`} data-tip="دوران تلقائي" onClick={() => setSpin((s) => !s)}>
                <Icon name="rotateL" size={18} />
              </button>
            </div>
            <div className="stage-hint">
              <span className="chip">اسحب حتى تدوّرها، وكبّر بالعجلة</span>
            </div>
          </div>
        </div>

        <div>
          <div className="crumbs">
            <Link to="/catalog">الموبيليا</Link>/
            <Link to={`/catalog?category=${product.categorySlug}`}>{product.categoryName}</Link>
          </div>
          <h1>{product.name}</h1>
          <div className="price">{formatPrice(product.price)}</div>
          <p className="muted" style={{ marginTop: 14, fontSize: '1.05rem' }}>
            {product.description}
          </p>

          <div style={{ margin: '18px 0' }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>اللون: {colorName(color)}</strong>
            <Swatches colors={product.colors} value={color} onChange={setColor} large />
          </div>

          <div className="specs">
            <div className="spec">
              <span>القياس (عرض × عمق × ارتفاع)</span>
              <strong>{formatDims(product.dims)}</strong>
            </div>
            <div className="spec">
              <span>وين تنحط</span>
              <strong>{kindLabel(product)}</strong>
            </div>
            <div className="spec">
              <span>الخامة</span>
              <strong>{product.material || 'خشب وقماش'}</strong>
            </div>
            <div className="spec">
              <span>التوصيل</span>
              <strong>٣ - ٥ أيام، مجاني ببغداد</strong>
            </div>
            <div className="spec">
              <span>الضمان</span>
              <strong>سنتين</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-lg"
              onClick={() => navigate(`/studio?add=${product.slug}&color=${encodeURIComponent(color)}`)}
            >
              <Icon name="cube" />
              جربها بغرفتك
            </button>
            <AddToCart product={product} color={color} large />
          </div>

          {product.modelUrl && (
            <div className="scan-note">
              <Icon name="info" size={18} />
              <p>
                هاي القطعة <strong>ممسوحة من الواقع بالـ3D</strong>: قياساتها وخاماتها مثل القطعة الحقيقية بالضبط.
                {product.credit && <> المجسّم من عمل {product.credit}، </>}
                مصدره{' '}
                <a href={product.sourceUrl} target="_blank" rel="noreferrer">
                  Poly Haven
                </a>{' '}
                برخصة CC0.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* phones: price and buy button always in reach */}
      <div className="buy-bar">
        <div>
          <strong>{formatPrice(product.price)}</strong>
          <span>{product.name}</span>
        </div>
        <AddToCart product={product} color={color} />
      </div>

      {data.related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">من نفس القسم</span>
              <h2>هم يعجبك</h2>
            </div>
          </div>
          <div className="grid">
            {data.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
