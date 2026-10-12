import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApi } from '../lib/useApi.js'
import { useAuth } from '../lib/auth.jsx'
import { useToast } from '../components/Toast.jsx'
import { ErrorState, Loading } from '../components/States.jsx'
import { DragChip, Sidebar } from './Sidebar.jsx'
import { Inspector, SettingsPanel, TemplatePicker, Toolbar } from './Panels.jsx'
import StudioScene from './StudioScene.jsx'
import { restoreDraft, useStudio } from './store.js'
import { dragApi } from './dragApi.js'

let draftChecked = false
const Q = Math.PI / 4
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

function useShortcuts() {
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
      const s = useStudio.getState()
      const key = e.key.toLowerCase()
      const mod = e.ctrlKey || e.metaKey

      if (mod && key === 'z' && !e.shiftKey) return e.preventDefault(), s.undo()
      if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) return e.preventDefault(), s.redo()
      if (key === 'escape') return dragApi.cancel(), s.select(null)

      // Arabic keyboard layout: ض = q, ث = e, ر = r
      const left = key === 'q' || key === 'ض'
      const right = key === 'e' || key === 'ث' || key === 'r' || key === 'ق'
      if (left || right) {
        const delta = left ? Q : -Q
        if (dragApi.rotateDrag(delta / 3)) return
        if (s.selected) s.rotateItem(s.selected, delta)
        return
      }
      if (!s.selected) return
      if (key === 'delete' || key === 'backspace') return e.preventDefault(), s.removeItem(s.selected)
      if (mod && key === 'd') return e.preventDefault(), s.duplicate(s.selected)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function StudioPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, ready } = useAuth()
  const toast = useToast()
  const products = useApi('/products')
  const productsReady = useStudio((s) => s.products.length > 0)
  const itemCount = useStudio((s) => s.items.length)
  const dragNew = useStudio((s) => s.draggingUid === 'new')
  const overCanvas = useStudio((s) => s.overCanvas)
  const [loadingDesign, setLoadingDesign] = useState(Boolean(id))
  const [designError, setDesignError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(false)
  const addedRef = useRef(null)

  useShortcuts()

  useEffect(() => {
    if (products.data) useStudio.getState().setProducts(products.data.products)
  }, [products.data])

  // Load the design in the URL, or restore the local draft.
  useEffect(() => {
    if (!id) {
      if (!draftChecked) {
        draftChecked = true
        const st = useStudio.getState()
        // A template chosen elsewhere (home page, "new design") wins over the old draft.
        const fresh = st.items.length > 0 || st.templatePicker || st.plan.template !== 'room'
        // First visit with nothing to restore: offer the room / flat / house templates.
        if (!fresh && !restoreDraft() && !params.get('add')) useStudio.setState({ templatePicker: true })
      }
      setLoadingDesign(false)
      return
    }
    if (!ready) return
    if (!user) {
      navigate('/login', { replace: true, state: { from: `/studio/${id}` } })
      return
    }
    draftChecked = true
    const current = useStudio.getState().design
    if (String(current.id) === id && useStudio.getState().items.length) {
      setLoadingDesign(false)
      return
    }
    let alive = true
    setLoadingDesign(true)
    setDesignError(null)
    api(`/designs/${id}`)
      .then((d) => alive && useStudio.getState().loadDesign(d.design))
      .catch((err) => alive && setDesignError(err))
      .finally(() => alive && setLoadingDesign(false))
    return () => {
      alive = false
    }
  }, [id, user, ready, navigate])

  // ?add=slug coming from a product page
  useEffect(() => {
    const slug = params.get('add')
    if (!slug || !productsReady || loadingDesign || addedRef.current === slug) return
    addedRef.current = slug
    const s = useStudio.getState()
    const product = s.products.find((p) => p.slug === slug)
    if (product) {
      const color = params.get('color')
      const ok = s.addProductNear(product, undefined, undefined, product.colors.includes(color) ? color : undefined)
      toast(ok ? `انضافت ${product.name} للغرفة` : 'الغرفة مليانة! كبّرها أو شيل شي', ok ? 'success' : 'error')
    }
    const next = new URLSearchParams(params)
    next.delete('add')
    next.delete('color')
    setParams(next, { replace: true })
  }, [params, productsReady, loadingDesign, setParams, toast])

  // Warn before leaving with unsaved changes (drafts are kept locally anyway).
  useEffect(() => {
    const onUnload = (e) => {
      if (useStudio.getState().dirty && useStudio.getState().items.length) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  const capture = useCallback(async (width) => {
    const prev = useStudio.getState().selected
    useStudio.getState().select(null)
    await nextFrame()
    const url = dragApi.capture(width)
    useStudio.getState().select(prev)
    return url
  }, [])

  const save = async () => {
    if (!user) {
      toast('سجّل دخول حتى تحفظ تصميمك — المسودة محفوظة عندك', 'error')
      navigate('/login', { state: { from: '/studio' } })
      return
    }
    const s = useStudio.getState()
    if (!s.design.name.trim()) return toast('انطي اسم للتصميم', 'error')
    setSaving(true)
    try {
      const thumbnail = await capture(640)
      const body = {
        name: s.design.name.trim(),
        plan: s.plan,
        items: s.items.map(({ uid, productId, x, z, rot, color, parent }) => ({
          uid, productId, x, z, rot, color, parent: parent || null,
        })),
        thumbnail,
      }
      const res = s.design.id
        ? await api(`/designs/${s.design.id}`, { method: 'PUT', body })
        : await api('/designs', { method: 'POST', body })
      s.setDesignMeta({ id: res.design.id, name: res.design.name })
      toast('انحفظ التصميم 👌')
      if (String(res.design.id) !== id) navigate(`/studio/${res.design.id}`, { replace: true })
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const screenshot = async () => {
    const url = await capture(1920)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${useStudio.getState().design.name || 'juman'}.jpg`
    a.click()
  }

  if (products.error) return <ErrorState error={products.error} onRetry={products.reload} />
  if (designError) return <ErrorState error={designError} onRetry={() => navigate('/studio')} />

  return (
    <div className="studio">
      <Sidebar />
      <div className="studio-stage">
        {(!productsReady || loadingDesign) && (
          <div className="studio-loading">
            <Loading label="دا نرتب الغرفة..." />
          </div>
        )}
        {productsReady && <StudioScene />}
        <div className={`drop-zone-glow ${dragNew && overCanvas ? 'on' : ''}`} />
        {productsReady && !loadingDesign && itemCount === 0 && !dragNew && (
          <div className="empty-room">
            <div>
              <h3 style={{ margin: '0 0 6px' }}>الغرفة فارغة 🏠</h3>
              <p className="muted" style={{ margin: 0 }}>
                اسحب أي قطعة من القائمة وذبها هنا، أو اضغط عليها وتنحط وحدها.
              </p>
            </div>
          </div>
        )}
        <Toolbar
          onSave={save}
          saving={saving}
          onSettings={() => setSettings((v) => !v)}
          settingsOpen={settings}
          onShot={screenshot}
        />
        {settings && <SettingsPanel onClose={() => setSettings(false)} />}
        <Inspector />
        <div className="hints">
          <span>🖱️ اسحب القطعة حتى تحركها، وبالعجلة تدوّرها وهي بإيدك</span>
          <span>
            <kbd>Q</kbd> <kbd>E</kbd> تدوير · <kbd>Delete</kbd> شيل · <kbd>Ctrl</kbd>+<kbd>Z</kbd> تراجع
          </span>
          <span>الأغراض الصغيرة (الفانوس، المزهرية) تنحط فوگ الميزات</span>
          <span>اضغط على أرضية أي غرفة حتى تختارها وتغيّر أرضيتها وحيطانها</span>
        </div>
      </div>
      <DragChip />
      <TemplatePicker />
    </div>
  )
}
