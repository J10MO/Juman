import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useThumbnail } from '../three/thumbnails.jsx'
import { colorName, formatPrice } from '../lib/format.js'
import { useCart } from '../lib/cart.js'
import { Icon } from './Icon.jsx'

export function ModelThumb({ product, color, className = 'thumb' }) {
  // Scanned products come with a real photo; built ones are rendered on the fly.
  const rendered = useThumbnail(product.imageUrl ? null : product, color)
  const url = product.imageUrl || rendered
  return (
    <>
      {url ? (
        <img key={url} src={url} alt={product.name} className={`${className} thumb-fade`} draggable={false} />
      ) : (
        <div className="shimmer" />
      )}
    </>
  )
}

export function Swatches({ colors, value, onChange, large }) {
  if (colors.length === 1 && colors[0] === 'natural') {
    return <span className="natural-badge">خامة أصلية</span>
  }
  return (
    <div className="swatches" role="radiogroup" aria-label="اللون">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={c === value}
          title={colorName(c)}
          aria-label={colorName(c)}
          className={`swatch ${large ? 'swatch-lg' : ''} ${c === value ? 'active' : ''}`}
          style={{ background: c }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onChange(c)
          }}
        />
      ))}
    </div>
  )
}

export function ProductCard({ product }) {
  const [color, setColor] = useState(product.colors[0])
  return (
    <Link to={`/product/${product.slug}`} className="card">
      <div className="card-media">
        <ModelThumb product={product} color={color} />
        {product.featured && <span className="card-badge">الأكثر طلب</span>}
        {product.modelUrl && <span className="card-badge scan-badge">حقيقي 3D</span>}
        <span className="card-peek">
          <Icon name="cube" size={14} /> شوفها 3D
        </span>
      </div>
      <div className="card-body">
        <span className="card-cat">
          {product.categoryName}
          {product.material && <> · {product.material}</>}
        </span>
        <h3 className="card-title">{product.name}</h3>
        <div className="card-foot">
          <span className="price">{formatPrice(product.price)}</span>
          <Swatches colors={product.colors} value={color} onChange={setColor} />
        </div>
        <AddToCart product={product} color={color} />
      </div>
    </Link>
  )
}

export function AddToCart({ product, color, large }) {
  const add = useCart((s) => s.add)
  const inCart = useCart((s) => s.lines.find((l) => l.productId === product.id && l.color === color)?.qty || 0)
  return (
    <button
      type="button"
      className={`btn ${large ? 'btn-lg' : 'btn-sm'} ${inCart ? 'btn-ghost' : 'btn-gold'} add-cart`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        add(product, color)
      }}
    >
      <Icon name="cart" size={large ? 20 : 16} />
      {inCart ? `بالسلة (${inCart}) + ضيف وحدة` : 'ضيف للسلة'}
    </button>
  )
}
