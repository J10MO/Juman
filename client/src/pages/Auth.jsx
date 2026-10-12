import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useToast } from '../components/Toast.jsx'

function useAfterAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  return () => navigate(location.state?.from || '/designs', { replace: true })
}

export function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const done = useAfterAuth()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast(`هلا بيك ${user.name.split(' ')[0]}، نورت!`)
      done()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">هلا بيك من جديد</span>
        <h1>سجّل دخول</h1>
        <p className="muted">حتى تحفظ تصاميمك وترجعلها من أي جهاز.</p>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label htmlFor="email">الإيميل</label>
          <input id="email" className="input" type="email" dir="ltr" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="password">الباسورد</label>
          <input id="password" className="input" type="password" dir="ltr" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'لحظة...' : 'دخول'}
        </button>
        <p className="auth-alt">
          ما عندك حساب؟ <Link to="/register" state={location.state}>سوّي حساب جديد</Link>
        </p>
      </form>
    </div>
  )
}

export function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const done = useAfterAuth()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 8) return setError('الباسورد لازم يكون ٨ أحرف على الأقل')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast('انسوى حسابك، أهلاً وسهلاً بيك بجُمان!')
      done()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">أول مرة هنا؟</span>
        <h1>سوّي حساب</h1>
        <p className="muted">دقيقة وحدة وتگدر تحفظ كل تصاميمك.</p>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label htmlFor="name">اسمك</label>
          <input id="name" className="input" autoComplete="name" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="email">الإيميل</label>
          <input id="email" className="input" type="email" dir="ltr" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="password">الباسورد (٨ أحرف أو أكثر)</label>
          <input id="password" className="input" type="password" dir="ltr" autoComplete="new-password" required minLength={8}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-gold btn-lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'دا نسوي الحساب...' : 'سوّي الحساب'}
        </button>
        <p className="auth-alt">
          عندك حساب؟ <Link to="/login" state={location.state}>سجّل دخول</Link>
        </p>
      </form>
    </div>
  )
}
