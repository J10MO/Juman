import { useState } from 'react'
import { Icon } from '../components/Icon.jsx'
import { Swatches } from '../components/ProductCard.jsx'
import { colorName, formatNumber, formatPrice } from '../lib/format.js'
import { FLOOR_NAMES } from '../three/textures.js'
import { WALL_COLORS, useStudio } from './store.js'
import { TEMPLATES, roomArea } from './plan.js'

const Q = Math.PI / 4
const WALL_MODES = {
  auto: { next: 'down', tip: 'الحيطان: تلقائي (اضغط حتى تنزّلها)' },
  down: { next: 'up', tip: 'الحيطان: نازلة (اضغط حتى ترفعها)' },
  up: { next: 'auto', tip: 'الحيطان: كاملة (اضغط للتلقائي)' },
}

export function Toolbar({ onSave, saving, onSettings, settingsOpen, onShot }) {
  const s = useStudio()
  const multi = s.plan.rooms.length > 1
  return (
    <div className="studio-top">
      <div className="toolbar">
        {s.dirty && <span className="dirty-dot" title="أكو تغييرات ما محفوظة" />}
        <input
          className="design-name"
          value={s.design.name}
          onChange={(e) => s.renameDesign(e.target.value)}
          aria-label="اسم التصميم"
          maxLength={80}
        />
        <button className="icon-btn" data-tip="تصميم جديد / بيت كامل" onClick={() => s.setOption('templatePicker', true)}>
          <Icon name="home" size={18} />
        </button>
        <span className="sep" />
        <button className="icon-btn" data-tip="تراجع (Ctrl+Z)" onClick={s.undo} disabled={!s.past.length}>
          <Icon name="undo" size={18} />
        </button>
        <button className="icon-btn" data-tip="رجّع (Ctrl+Y)" onClick={s.redo} disabled={!s.future.length}>
          <Icon name="redo" size={18} />
        </button>
        <span className="sep" />
        <button className="icon-btn" data-tip={multi ? 'منظر البيت كله' : 'منظر ثلاثي'} onClick={() => s.camera('persp')}>
          <Icon name="cube" size={18} />
        </button>
        <button className="icon-btn" data-tip="من فوگ (مخطط)" onClick={() => s.camera('top')}>
          <Icon name="top" size={18} />
        </button>
        <button className="icon-btn" data-tip="كأنك واگف بالغرفة" onClick={() => s.camera('corner', s.activeRoom)}>
          <Icon name="eye" size={18} />
        </button>
      </div>

      <div className="toolbar">
        <button
          className={`icon-btn ${s.walls !== 'auto' ? 'active' : ''}`}
          data-tip={WALL_MODES[s.walls].tip}
          onClick={() => s.setOption('walls', WALL_MODES[s.walls].next)}
        >
          <Icon name="walls" size={18} />
        </button>
        <button className={`icon-btn ${s.snap ? 'active' : ''}`} data-tip="التصاگ بالشبكة والحيطان" onClick={() => s.setOption('snap', !s.snap)}>
          <Icon name="grid" size={18} />
        </button>
        <button className={`icon-btn ${s.guides ? 'active' : ''}`} data-tip="المسافات للحيطان" onClick={() => s.setOption('guides', !s.guides)}>
          <Icon name="ruler" size={18} />
        </button>
        <button className={`icon-btn ${s.night ? 'active' : ''}`} data-tip={s.night ? 'رجّعها نهار' : 'شوفها بالليل'} onClick={() => s.setOption('night', !s.night)}>
          <Icon name={s.night ? 'sun' : 'moon'} size={18} />
        </button>
        <button className={`icon-btn ${settingsOpen ? 'active' : ''}`} data-tip={multi ? 'الغرف والإعدادات' : 'إعدادات الغرفة'} onClick={onSettings}>
          <Icon name="settings" size={18} />
        </button>
        <button className="icon-btn" data-tip="نزّل صورة" onClick={onShot}>
          <Icon name="camera" size={18} />
        </button>
        <span className="sep" />
        <button className="btn btn-sm btn-gold" onClick={onSave} disabled={saving}>
          <Icon name="save" size={16} />
          {saving ? 'دا نحفظ...' : 'احفظ'}
        </button>
      </div>
    </div>
  )
}

export function Inspector() {
  const selected = useStudio((s) => s.selected)
  const dragging = useStudio((s) => s.draggingUid)
  const item = useStudio((s) => s.items.find((i) => i.uid === s.selected))
  const product = useStudio((s) => (item ? s.productMap[item.productId] : null))
  const { updateItem, rotateItem, duplicate, removeItem, select } = useStudio.getState()
  const hostName = useStudio((s) => {
    if (!item?.parent) return null
    const host = s.items.find((i) => i.uid === item.parent)
    return host ? s.productMap[host.productId]?.name : null
  })

  if (!selected || !item || !product || dragging) return null
  return (
    <div className="inspector" key={selected}>
      {product.imageUrl && <img className="insp-photo" src={product.imageUrl} alt="" />}
      <div className="insp-title">
        {product.name}
        <small>
          {formatPrice(product.price)} · {colorName(item.color)}
          {hostName && ` · فوگ ${hostName}`}
        </small>
      </div>
      <Swatches colors={product.colors} value={item.color} onChange={(c) => updateItem(item.uid, { color: c })} />
      <div className="insp-group">
        <button className="icon-btn" data-tip="دوّر يمين (E)" onClick={() => rotateItem(item.uid, -Q)}>
          <Icon name="rotateR" size={18} />
        </button>
        <button className="icon-btn" data-tip="دوّر يسار (Q)" onClick={() => rotateItem(item.uid, Q)}>
          <Icon name="rotateL" size={18} />
        </button>
        <button className="icon-btn" data-tip="كرر (Ctrl+D)" onClick={() => duplicate(item.uid)}>
          <Icon name="copy" size={18} />
        </button>
        <button className="icon-btn" data-tip="شيلها (Delete)" onClick={() => removeItem(item.uid)}>
          <Icon name="trash" size={18} />
        </button>
        <button className="icon-btn" data-tip="سد" onClick={() => select(null)}>
          <Icon name="close" size={18} />
        </button>
      </div>
    </div>
  )
}

function RoomSlider({ room, label, k }) {
  return (
    <div className="field">
      <label>
        {label} <span>{formatNumber(room[k])} م</span>
      </label>
      <input
        className="range"
        type="range"
        min={2.5}
        max={10}
        step={0.1}
        value={room[k]}
        onPointerDown={() => useStudio.getState().record()}
        onKeyDown={() => useStudio.getState().record()}
        onChange={(e) => {
          const v = Number(e.target.value)
          // single-room plans stay centred on the origin
          useStudio.getState().updateRoom(room.id, { [k]: v, x: 0, z: 0 }, { record: false })
          useStudio.getState().fitItemsToRooms()
        }}
      />
    </div>
  )
}

export function SettingsPanel({ onClose }) {
  const plan = useStudio((s) => s.plan)
  const activeRoom = useStudio((s) => s.activeRoom)
  const quality = useStudio((s) => s.quality)
  const { updateRoom, setOption, clearAll, setActiveRoom, camera } = useStudio.getState()
  const itemsCount = useStudio((s) => s.items.length)
  const [confirmClear, setConfirmClear] = useState(false)
  const multi = plan.rooms.length > 1
  const room = plan.rooms.find((r) => r.id === activeRoom) || plan.rooms[0]
  const total = plan.rooms.reduce((n, r) => n + roomArea(r), 0)

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>{multi ? `${TEMPLATES[plan.template]?.name || 'البيت'} · ${formatNumber(Math.round(total))} م²` : 'إعدادات الغرفة'}</h4>
        <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} aria-label="سد">
          <Icon name="close" size={16} />
        </button>
      </div>
      <div style={{ height: 12 }} />

      {multi && (
        <div className="room-chips">
          {plan.rooms.map((r) => (
            <button
              key={r.id}
              className={r.id === room.id ? 'active' : ''}
              onClick={() => {
                setActiveRoom(r.id)
                camera('room', r.id)
              }}
            >
              {r.name}
              <small>{formatNumber(roomArea(r))} م²</small>
            </button>
          ))}
        </div>
      )}

      <div className="field">
        <label>اسم الغرفة</label>
        <input
          className="input"
          value={room.name}
          maxLength={40}
          onFocus={() => useStudio.getState().record()}
          onChange={(e) => updateRoom(room.id, { name: e.target.value }, { record: false })}
        />
      </div>
      {!multi && (
        <>
          <RoomSlider room={room} label="عرض الغرفة" k="width" />
          <RoomSlider room={room} label="طول الغرفة" k="depth" />
        </>
      )}
      <div className="field">
        <label>لون الحيطان</label>
        <Swatches colors={WALL_COLORS} value={room.wallColor} onChange={(c) => updateRoom(room.id, { wallColor: c })} />
      </div>
      <div className="field">
        <label>الأرضية</label>
        <div className="floor-opts">
          {Object.entries(FLOOR_NAMES).map(([k, name]) => (
            <button key={k} className={room.floor === k ? 'active' : ''} onClick={() => updateRoom(room.id, { floor: k })}>
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="toggle-row">
        <span>جودة عالية (ظلال وإضاءة واقعية)</span>
        <button
          className={`switch ${quality === 'high' ? 'on' : ''}`}
          aria-label="جودة عالية"
          onClick={() => setOption('quality', quality === 'high' ? 'low' : 'high')}
        />
      </div>
      {itemsCount > 0 && (
        <button
          className={`btn btn-sm ${confirmClear ? 'btn-danger' : 'btn-ghost'}`}
          style={{ width: '100%', marginTop: 10 }}
          onClick={() => {
            if (!confirmClear) return setConfirmClear(true)
            clearAll()
            setConfirmClear(false)
          }}
        >
          <Icon name="trash" size={16} />
          {confirmClear ? 'متأكد؟ اضغط مرة ثانية' : multi ? 'فرّغ البيت كله' : 'فرّغ الغرفة'}
        </button>
      )}
    </div>
  )
}

const TEMPLATE_ICONS = { room: '▢', apartment: '▦', house: '⌂' }

export function TemplatePicker() {
  const open = useStudio((s) => s.templatePicker)
  const hasProducts = useStudio((s) => s.products.length > 0)
  const itemCount = useStudio((s) => s.items.length)
  const [choice, setChoice] = useState('house')
  const [furnished, setFurnished] = useState(true)
  if (!open) return null
  const close = () => useStudio.setState({ templatePicker: false })
  return (
    <div className="modal-back" onClick={close}>
      <div className="modal template-modal" onClick={(e) => e.stopPropagation()}>
        <h3>شنو تريد تصمم؟</h3>
        <p className="muted">اختار غرفة وحدة، شقة، أو بيت كامل بكل غرفه. تگدر تخلي جُمان يأثثه إلك، وبعدين تغيّر اللي يعجبك.</p>
        <div className="template-grid">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button key={key} className={`template-card ${choice === key ? 'active' : ''}`} onClick={() => setChoice(key)}>
              <PlanPreview template={key} />
              <strong>
                {TEMPLATE_ICONS[key]} {t.name}
              </strong>
              <span>{t.blurb}</span>
              <small>
                {formatNumber(t.rooms.length)} {t.rooms.length === 1 ? 'غرفة' : 'غرف'} ·{' '}
                {formatNumber(Math.round(t.rooms.reduce((n, r) => n + roomArea(r), 0)))} م²
              </small>
            </button>
          ))}
        </div>
        <label className="toggle-row" style={{ cursor: 'pointer' }}>
          <span>
            <Icon name="wand" size={16} /> أثّثه إلي تلقائياً (تگدر تغيّر كل شي بعدين)
          </span>
          <button
            type="button"
            className={`switch ${furnished ? 'on' : ''}`}
            onClick={() => setFurnished((f) => !f)}
            aria-label="تأثيث تلقائي"
          />
        </label>
        {itemCount > 0 && <p className="form-error" style={{ margin: '8px 0' }}>التصميم الحالي راح ينمسح. إذا تريده احفظه أول.</p>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={close}>
            رجوع
          </button>
          <button
            className="btn btn-gold"
            disabled={!hasProducts}
            onClick={() => useStudio.getState().newDesign(choice, { furnished })}
          >
            يلا نبدي
          </button>
        </div>
      </div>
    </div>
  )
}

/** Tiny SVG floor plan of a template. */
function PlanPreview({ template }) {
  const rooms = TEMPLATES[template].rooms
  const xs = rooms.flatMap((r) => [r.x - r.width / 2, r.x + r.width / 2])
  const zs = rooms.flatMap((r) => [r.z - r.depth / 2, r.z + r.depth / 2])
  const minX = Math.min(...xs)
  const minZ = Math.min(...zs)
  const w = Math.max(...xs) - minX
  const d = Math.max(...zs) - minZ
  return (
    <svg className="plan-preview" viewBox={`-0.3 -0.3 ${w + 0.6} ${d + 0.6}`} aria-hidden="true">
      {rooms.map((r) => (
        <g key={r.id}>
          <rect
            x={r.x - r.width / 2 - minX}
            y={r.z - r.depth / 2 - minZ}
            width={r.width}
            height={r.depth}
            fill={r.wallColor}
            stroke="#14213d"
            strokeWidth={0.12}
          />
          {rooms.length > 1 && (
            <text x={r.x - minX} y={r.z - minZ} fontSize={Math.min(0.75, r.width / 5)} textAnchor="middle" dominantBaseline="middle" fill="#14213d">
              {r.name}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
