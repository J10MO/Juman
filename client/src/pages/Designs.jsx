import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon.jsx'
import { ErrorState, Loading } from '../components/States.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { formatNumber, formatPrice, timeAgo } from '../lib/format.js'

const ORDER_STATUS = { new: 'جديد — راح نتصل بيك', confirmed: 'مؤكد', shipping: 'بالطريق', delivered: 'وصل' }
import { useStudio } from '../studio/store.js'

export default function Designs() {
  const { data, error, loading, reload } = useApi('/designs', { cacheable: false })
  const orders = useApi('/orders', { cacheable: false })
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const remove = async () => {
    setBusy(true)
    try {
      await api(`/designs/${confirm.id}`, { method: 'DELETE' })
      if (useStudio.getState().design.id === confirm.id) useStudio.getState().newDesign()
      toast('انمسح التصميم')
      setConfirm(null)
      reload()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container">
      <div className="page-head section-head">
        <div>
          <span className="eyebrow">مساحتك</span>
          <h1>تصاميمي</h1>
          <p className="muted" style={{ margin: 0 }}>كل التصاميم اللي حفظتها، تگدر تفتحها وتكمل عليها بأي وقت.</p>
        </div>
        <button
          className="btn btn-gold"
          onClick={() => {
            useStudio.setState({ templatePicker: true })
            navigate('/studio')
          }}
        >
          <Icon name="plus" />
          تصميم جديد
        </button>
      </div>

      {loading && !data && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data &&
        (data.designs.length ? (
          <div className="grid">
            {data.designs.map((d) => (
              <div key={d.id} className="card design-card">
                <Link to={`/studio/${d.id}`} className="card-media">
                  {d.thumbnail ? <img src={d.thumbnail} alt={d.name} /> : <div className="shimmer" style={{ animation: 'none' }} />}
                </Link>
                <div className="card-body">
                  <h3 className="card-title">{d.name}</h3>
                  <span className="card-cat">
                    {formatNumber(d.itemCount)} قطعة ·{' '}
                    {d.plan?.rooms?.length > 1
                      ? `${formatNumber(d.plan.rooms.length)} غرف`
                      : `غرفة ${formatNumber(d.room.width)}×${formatNumber(d.room.depth)} م`}{' '}
                    ·{' '}
                    {timeAgo(d.updatedAt)}
                  </span>
                  <div className="card-foot">
                    <Link to={`/studio/${d.id}`} className="btn btn-sm">
                      افتح
                    </Link>
                    <button className="icon-btn" data-tip="امسح" aria-label="امسح" onClick={() => setConfirm(d)}>
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>بعدك ما سويت أي تصميم</h3>
            <p className="muted">افتح الاستوديو، اسحب الموبيليا للغرفة، واحفظ. سهلة!</p>
            <Link to="/studio" className="btn">
              <Icon name="cube" /> يلا نبدي
            </Link>
          </div>
        ))}

      {orders.data?.orders.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">طلباتي</span>
              <h2>الطلبات اللي سويتها</h2>
            </div>
          </div>
          <div className="orders">
            {orders.data.orders.map((o) => (
              <div key={o.id} className="order-row">
                <strong>طلب #{formatNumber(o.id)}</strong>
                <span className="muted">
                  {formatNumber(o.items.reduce((n, l) => n + l.qty, 0))} قطعة · {o.governorate} · {timeAgo(o.createdAt)}
                </span>
                <span className="status">{ORDER_STATUS[o.status] || o.status}</span>
                <strong>{formatPrice(o.total)}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {confirm && (
        <div className="modal-back" onClick={() => !busy && setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>متأكد تريد تمسحه؟</h3>
            <p className="muted">«{confirm.name}» راح ينمسح نهائياً وما تگدر ترجعه.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)} disabled={busy}>
                لا، خليه
              </button>
              <button className="btn btn-danger" onClick={remove} disabled={busy}>
                {busy ? 'دا نمسح...' : 'إي، امسحه'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
