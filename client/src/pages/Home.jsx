import { Suspense, lazy, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon.jsx'
import { ProductCard } from '../components/ProductCard.jsx'
import { ErrorState, Loading } from '../components/States.jsx'
import { useApi } from '../lib/useApi.js'
import { api } from '../lib/api.js'
import { formatNumber } from '../lib/format.js'
import { TEMPLATES, roomArea } from '../studio/plan.js'
import { useStudio } from '../studio/store.js'
import { useNavigate } from 'react-router-dom'

const HeroScene = lazy(() => import('../components/HeroScene.jsx'))

const STEPS = [
  { icon: 'hand', title: 'اسحب القطعة', text: 'اختار القنفة أو الميز من القائمة، اسحبها بإيدك وذبها جوة الغرفة. تشوفها بالـ3D على حقيقتها.' },
  { icon: 'rotateL', title: 'رتّب على كيفك', text: 'حرّك، دوّر وغيّر اللون. القطع ما تدخل ببعضها، وتلزگ بالحايط، والصغيرة تنحط فوگ الميزات.' },
  { icon: 'truck', title: 'احفظ واطلب', text: 'احفظ تصميمك وشوف الحساب الكلي. نوصلّك الطلب لباب البيت، وننصبه إلك ببلاش ببغداد.' },
]

const TRUST = [
  { icon: 'truck2', title: 'توصيل لكل العراق', text: '١٨ محافظة، ومجاني ببغداد' },
  { icon: 'cash', title: 'الدفع عند الاستلام', text: 'ما تدفع إلا من تشوف القطعة' },
  { icon: 'shield', title: 'ضمان سنتين', text: 'على كل الموبيليا' },
  { icon: 'tools', title: 'نصب ببلاش', text: 'فريقنا يركّب كل شي إلك' },
]

const QUOTES = [
  { name: 'أم علي — المنصور', text: 'والله ما چنت أعرف شلون تطلع القنفة بالصالة، صممتها هنا وطلعت نفس الشي بالضبط. تسلم إيدكم!' },
  { name: 'حيدر — البصرة', text: 'خوش فكرة! رتبت غرفة النوم كلها قبل لا أشتري، ووفرت على نفسي هواية دوخة راس.' },
  { name: 'زينب — أربيل', text: 'أحلى شي الأغراض الصغيرة تنحط فوگ الميز. فرّجت أهلي على التصميم كلهم عجبهم.' },
]

function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', body: '' })
  const [status, setStatus] = useState({ loading: false, error: null, ok: null })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, error: null, ok: null })
    try {
      const d = await api('/contact', { method: 'POST', body: form })
      setStatus({ loading: false, error: null, ok: d.message })
      setForm({ name: '', phone: '', email: '', body: '' })
    } catch (err) {
      setStatus({ loading: false, error: err.message, ok: null })
    }
  }

  return (
    <form onSubmit={submit}>
      {status.error && <div className="form-error">{status.error}</div>}
      {status.ok && <div className="form-success">{status.ok}</div>}
      <div className="field">
        <input className="input" placeholder="اسمك" value={form.name} onChange={set('name')} required />
      </div>
      <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input className="input" placeholder="رقم الموبايل" value={form.phone} onChange={set('phone')} inputMode="tel" dir="ltr" />
        <input className="input" placeholder="الإيميل" value={form.email} onChange={set('email')} type="email" dir="ltr" />
      </div>
      <div className="field">
        <textarea className="textarea" placeholder="شنو تحتاج؟ احچيلنا..." value={form.body} onChange={set('body')} required />
      </div>
      <button className="btn btn-gold btn-lg" disabled={status.loading} style={{ width: '100%' }}>
        {status.loading ? 'دا ندز...' : 'دز الرسالة'}
      </button>
    </form>
  )
}

function PlanCards() {
  const navigate = useNavigate()
  return (
    <div className="home-plans">
      {Object.entries(TEMPLATES).map(([key, t]) => (
        <button
          key={key}
          className="home-plan card"
          onClick={() => {
            // open the studio straight into this template, furnished
            if (useStudio.getState().products.length) useStudio.getState().newDesign(key, { furnished: true })
            else useStudio.setState({ templatePicker: true })
            navigate('/studio')
          }}
        >
          <h3>{t.name}</h3>
          <span className="muted">{t.blurb}</span>
          <small className="muted">
            {formatNumber(t.rooms.length)} {t.rooms.length === 1 ? 'غرفة' : 'غرف'} ·{' '}
            {formatNumber(Math.round(t.rooms.reduce((n, r) => n + roomArea(r), 0)))} م²
          </small>
          <span className="btn btn-sm" style={{ justifySelf: 'start' }}>
            <Icon name="home" size={16} /> صمّمه هسه
          </span>
        </button>
      ))}
    </div>
  )
}

export default function Home() {
  const featured = useApi('/products?featured=1')
  const scanned = useApi('/products?source=scan')
  // one real photo per category for the category cards
  const catImage = {}
  for (const p of scanned.data?.products || []) {
    if (!catImage[p.categorySlug] && p.kind !== 'small') catImage[p.categorySlug] = p.imageUrl
  }
  catImage.kitchen ??= (scanned.data?.products || []).find((p) => p.categorySlug === 'kitchen')?.imageUrl
  const cats = useApi('/categories')

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">موبيليا بالـ3D، بلهجتنا</span>
            <h1>
              صمّم بيتك <em>على كيفك</em>،
              <br />
              وشوفه قبل لا تشتري
            </h1>
            <p className="hero-lead">
              بجُمان تسحب القنفة وتذبها بالصالة، تدوّر الميز، تغيّر اللون، وتشوف شلون يطلع الضوي بالليل. كلشي حقيقي
              وبالقياسات الصحيحة، حتى ما تتفاجأ يوم يوصل الغرض.
            </p>
            <div className="hero-actions">
              <Link to="/studio" className="btn btn-lg">
                <Icon name="cube" />
                افتح الاستوديو
              </Link>
              <Link to="/catalog" className="btn btn-ghost btn-lg">
                تفرّج على الموبيليا
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <strong>{formatNumber(70)}+</strong>
                <span>منتج بالـ3D</span>
              </div>
              <div>
                <strong>{formatNumber(18)}</strong>
                <span>محافظة نوصلها</span>
              </div>
              <div>
                <strong>{formatNumber(4.9)}★</strong>
                <span>تقييم الزباين</span>
              </div>
            </div>
          </div>
          <div className="hero-stage">
            <Suspense fallback={<div className="shimmer" />}>
              <HeroScene />
            </Suspense>
            <div className="stage-hint">
              <span className="chip">
                <Icon name="sparkle" size={14} /> كل القطع مجسمات حقيقية
              </span>
              <span className="chip">حرّك الماوس 👀</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <ul className="trust">
          {TRUST.map((t) => (
            <li key={t.title}>
              <span className="trust-icon">
                <Icon name={t.icon} size={22} />
              </span>
              <div>
                <strong>{t.title}</strong>
                <span>{t.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">شلون تشتغل؟</span>
              <h2>ثلاث خطوات وبيتك جاهز</h2>
            </div>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={s.title}>
                <span className="step-num">{formatNumber(i + 1)}</span>
                <div className="step-icon">
                  <Icon name={s.icon} size={26} />
                </div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">الأكثر طلب</span>
              <h2>قطع الناس تحبها</h2>
            </div>
            <Link to="/catalog" className="btn btn-ghost">
              شوف الكل
              <Icon name="arrow" size={18} />
            </Link>
          </div>
          {featured.loading && <Loading />}
          {featured.error && <ErrorState error={featured.error} onRetry={featured.reload} />}
          {featured.data && (
            <div className="grid">
              {featured.data.products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">جديد: بيت كامل</span>
              <h2>مو بس غرفة، صمّم بيتك كله</h2>
              <p className="muted" style={{ margin: 0 }}>
                اختار مخطط، وجُمان يأثثه إلك تلقائياً: ديوانية، هول، مطبخ، غرف نوم وحمام. بعدين حرّك وبدّل على كيفك.
              </p>
            </div>
          </div>
          <PlanCards />
        </div>
      </section>

      {scanned.data?.products.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">موبيليا حقيقية ممسوحة 3D</span>
                <h2>قطع حقيقية، مو رسم</h2>
                <p className="muted" style={{ margin: 0 }}>
                  {formatNumber(scanned.data.products.length)} قطعة ممسوحة من الواقع بالـ3D، بقياساتها وخاماتها الأصلية.
                </p>
              </div>
              <Link to="/catalog?source=scan" className="btn btn-ghost">
                شوف الكل
                <Icon name="arrow" size={18} />
              </Link>
            </div>
            <div className="grid">
              {scanned.data.products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {cats.data && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">الأقسام</span>
                <h2>شتحتاج اليوم؟</h2>
              </div>
            </div>
            <div className="cats">
              {cats.data.categories.map((c) => (
                <Link key={c.slug} to={`/catalog?category=${c.slug}`} className="cat">
                  <div>
                    <h3>{c.name}</h3>
                    <p>{c.blurb}</p>
                  </div>
                  {catImage[c.slug] && <img className="cat-img" src={catImage[c.slug]} alt="" loading="lazy" />}
                  <span className="cat-count">{formatNumber(c.productCount)} قطعة ←</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">شگالوا عنا</span>
              <h2>زباينّا من كل العراق</h2>
            </div>
          </div>
          <div className="quotes">
            {QUOTES.map((q) => (
              <div className="quote" key={q.name}>
                <p>«{q.text}»</p>
                <div className="quote-who">
                  <span className="avatar">{q.name[0]}</span>
                  {q.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container">
          <div className="cta">
            <div>
              <span className="eyebrow">تواصل ويانا</span>
              <h2>محتار؟ احچي ويانا وإحنا نساعدك</h2>
              <p style={{ opacity: 0.8 }}>
                مصممينا يساعدوك تختار القطع المناسبة لبيتك ببلاش. دزلنا رسالة ونرجعلك بنفس اليوم إن شاء الله.
              </p>
              <ul className="cta-list">
                <li><Icon name="truck" /> توصيل لكل المحافظات</li>
                <li><Icon name="shield" /> ضمان سنتين على كل القطع</li>
                <li><Icon name="phone" /> <span dir="ltr">+964 770 000 0000</span></li>
                <li><Icon name="pin" /> بغداد — الكرادة داخل، قرب ساحة كهرمانة</li>
              </ul>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}
