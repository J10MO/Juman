import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { cartCount, useCart } from '../lib/cart.js'
import { Icon, LogoMark } from './Icon.jsx'

export function Navbar() {
  const { user, logout } = useAuth()
  const count = useCart(cartCount)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="logo" aria-label="جُمان - الرئيسية">
          <LogoMark />
          جُمان
        </Link>
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end>
            الرئيسية
          </NavLink>
          <NavLink to="/catalog">الموبيليا</NavLink>
          <NavLink to="/studio">استوديو التصميم</NavLink>
          <NavLink to="/designs">تصاميمي</NavLink>
        </nav>
        <div className="nav-actions">
          <Link to="/cart" className="icon-btn cart-btn" aria-label="السلة" data-tip="السلة">
            <Icon name="cart" size={19} />
            {count > 0 && <span className="cart-badge">{count > 99 ? '99+' : count}</span>}
          </Link>
          {user ? (
            <>
              <span className="nav-user">
                <span>هلا {user.name.split(' ')[0]}</span>
                <span className="avatar" style={{ display: 'grid' }}>
                  {user.name.trim()[0]}
                </span>
              </span>
              <button
                className="icon-btn"
                data-tip="طلوع"
                aria-label="تسجيل خروج"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                <Icon name="logout" size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-sm">
              دخول
            </Link>
          )}
          <button className="icon-btn nav-toggle" aria-label="القائمة" onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo">
              <LogoMark />
              جُمان
            </div>
            <p>
              نخليك تشوف بيتك قبل لا تشتري. اسحب، ذب، دوّر ورتّب على راحتك، وبعدين اطلب وإحنا نوصلّك لباب البيت بكل
              محافظات العراق.
            </p>
          </div>
          <div>
            <h4>روابط</h4>
            <ul>
              <li><Link to="/catalog">كل الموبيليا</Link></li>
              <li><Link to="/studio">استوديو التصميم</Link></li>
              <li><Link to="/designs">تصاميمي</Link></li>
              <li><Link to="/#contact">تواصل ويانا</Link></li>
            </ul>
          </div>
          <div>
            <h4>تواصل</h4>
            <ul>
              <li>بغداد — الكرادة داخل</li>
              <li dir="ltr" style={{ textAlign: 'right' }}>+964 770 000 0000</li>
              <li>من السبت للخميس، ٩ الصبح لـ ٩ بالليل</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} جُمان. كل الحقوق محفوظة.</span>
          <span>مصنوع بمحبة ببغداد 🤍</span>
        </div>
      </div>
    </footer>
  )
}

/** App-style tab bar for phones (hidden on desktop and inside the studio). */
export function MobileTabs() {
  const count = useCart(cartCount)
  const { user } = useAuth()
  const { pathname } = useLocation()
  if (pathname.startsWith('/studio')) return null
  const tabs = [
    { to: '/', icon: 'home', label: 'الرئيسية', end: true },
    { to: '/catalog', icon: 'sofa', label: 'الموبيليا' },
    { to: '/studio', icon: 'cube', label: 'الاستوديو', main: true },
    { to: '/cart', icon: 'cart', label: 'السلة', badge: count },
    { to: user ? '/designs' : '/login', icon: 'user', label: user ? 'حسابي' : 'دخول' },
  ]
  return (
    <nav className="tabbar" aria-label="التنقل">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={`tab ${t.main ? 'tab-main' : ''}`}>
          <span className="tab-icon">
            <Icon name={t.icon} size={t.main ? 24 : 21} />
            {t.badge > 0 && <span className="cart-badge">{t.badge > 99 ? '99+' : t.badge}</span>}
          </span>
          <span className="tab-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
