// 2D floor-plan editor: move and resize rooms, add or remove rooms, and place
// doors and windows on any wall. Works with mouse and touch (pointer events).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/Icon.jsx'
import { formatNumber } from '../lib/format.js'
import { useToast } from '../components/Toast.jsx'
import {
  OPENING_DEFAULTS, R, ROOM_TYPES, WALL_T, clampOnPiece, cleanOpenings, newOpeningId, newRoomId, pieceFor, planBounds,
  roomArea, roomRect, roomsOverlap, wallPieces,
} from './plan.js'
import { useStudio } from './store.js'

const SNAP = 0.1 // metres
const EDGE_SNAP = 0.3 // pull edges onto a neighbour's edge within this distance
const MIN_SIZE = 1.5
const FLOOR_TINT = { oak: '#ead7b7', walnut: '#cfae8c', marble: '#eef0f2', terrazzo: '#e7e1d6' }
const OPENING_NAMES = { door: 'باب', entrance: 'باب رئيسي', window: 'شباك' }

const snap = (v, step = SNAP) => Math.round(v / step) * step
const round2 = (v) => Math.round(v * 100) / 100
const fmt = (m) => `${formatNumber(round2(m))} م`

function fitView(rooms) {
  const b = planBounds(rooms)
  const pad = Math.max(1.6, Math.max(b.width, b.depth) * 0.12)
  return { x: b.minX - pad, y: b.minZ - pad, w: b.width + pad * 2, h: b.depth + pad * 2 }
}

/** Shift a rect so its edges land on nearby edges of other rooms. */
function edgeSnap(rect, others, axis) {
  const mine = axis === 'x' ? [rect.x0, rect.x1] : [rect.z0, rect.z1]
  let best = null
  for (const o of others) {
    const r = roomRect(o)
    const theirs = axis === 'x' ? [r.x0, r.x1] : [r.z0, r.z1]
    for (const m of mine) {
      for (const t of theirs) {
        const d = t - m
        if (Math.abs(d) < EDGE_SNAP && (!best || Math.abs(d) < Math.abs(best))) best = d
      }
    }
  }
  return best || 0
}

const rectToRoom = (room, { x0, x1, z0, z1 }) => ({
  ...room,
  x: round2((x0 + x1) / 2),
  z: round2((z0 + z1) / 2),
  width: round2(x1 - x0),
  depth: round2(z1 - z0),
})

export function PlanEditor({ onClose }) {
  const plan = useStudio((s) => s.plan)
  const toast = useToast()
  const [mode, setMode] = useState('select') // select | door | window | entrance
  const [sel, setSel] = useState(null) // { kind: 'room' | 'opening', id }
  const [view, setView] = useState(() => fitView(plan.rooms))
  const [addType, setAddType] = useState('bedroom')
  const svgRef = useRef(null)
  const gesture = useRef(null)
  const walls = useMemo(() => wallPieces(plan.rooms), [plan.rooms])
  const roomCount = plan.rooms.length

  // refit when rooms are added or removed (not while dragging, to avoid jumps)
  useEffect(() => {
    if (!gesture.current) setView(fitView(useStudio.getState().plan.rooms))
  }, [roomCount])

  const st = () => useStudio.getState()
  const toWorld = (e) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: p.x, z: p.y }
  }
  const startGesture = (e, g) => {
    e.stopPropagation()
    svgRef.current.setPointerCapture?.(e.pointerId)
    gesture.current = { ...g, start: toWorld(e), recorded: false }
  }
  const recordOnce = () => {
    if (!gesture.current.recorded) {
      st().record()
      gesture.current.recorded = true
    }
  }

  // ---- adding openings ---------------------------------------------------
  const addOpeningAt = (pt, type) => {
    // nearest wall piece to the point
    let best = null
    for (const w of walls) {
      const along = w.axis === 'x' ? pt.x : pt.z
      const across = w.axis === 'x' ? pt.z : pt.x
      const t = Math.min(w.b, Math.max(w.a, along))
      const d = Math.hypot(along - t, across - w.line)
      if (!best || d < best.d) best = { w, d, along }
    }
    if (!best || best.d > 0.6) return toast('اضغط على حايط حتى تحط عليه', 'error')
    if (type === 'entrance' && !best.w.exterior) return toast('الباب الرئيسي ينحط على حايط خارجي', 'error')
    const d = OPENING_DEFAULTS[type]
    const width = Math.min(d.w, best.w.b - best.w.a - 0.2)
    if (width < 0.5) return toast('الحايط كلش قصير لهذا', 'error')
    const at = snap(clampOnPiece(best.along, width, best.w), 0.05)
    // a door opens towards the side that was tapped (the main door always opens inwards)
    const across = best.w.axis === 'x' ? pt.z : pt.x
    const swing = type === 'window' ? undefined : type === 'entrance' ? best.w.side.inward : across >= best.w.line ? 1 : -1
    const op = { id: newOpeningId(), type, axis: best.w.axis, line: best.w.line, ...d, w: round2(width), at: round2(at), swing }
    // no overlapping openings on the same wall
    const clash = (plan.openings || []).some(
      (o) => o.axis === op.axis && Math.abs(o.line - op.line) < 1e-3 && Math.abs(o.at - op.at) < (o.w + op.w) / 2 + 0.1,
    )
    if (clash) return toast('أكو فتحة بهذا المكان، اختار مكان ثاني', 'error')
    st().setPlan({ ...plan, openings: [...(plan.openings || []), op] })
    setSel({ kind: 'opening', id: op.id })
    setMode('select')
  }

  // ---- pointer handling --------------------------------------------------
  const onBackgroundDown = (e) => {
    if (mode !== 'select') return addOpeningAt(toWorld(e), mode)
    setSel(null)
  }

  const onMove = (e) => {
    const g = gesture.current
    if (!g) return
    const p = toWorld(e)
    const s = st()
    const others = s.plan.rooms.filter((r) => r.id !== g.id)

    if (g.type === 'move') {
      const room = s.plan.rooms.find((r) => r.id === g.id)
      const base = g.origin
      let dx = snap(p.x - g.start.x)
      let dz = snap(p.z - g.start.z)
      const rect = { x0: base.x0 + dx, x1: base.x1 + dx, z0: base.z0 + dz, z1: base.z1 + dz }
      dx += edgeSnap(rect, others, 'x')
      dz += edgeSnap(rect, others, 'z')
      const target = rectToRoom(room, { x0: base.x0 + dx, x1: base.x1 + dx, z0: base.z0 + dz, z1: base.z1 + dz })
      if (others.some((o) => roomsOverlap(target, o))) return
      const ddx = round2(target.x - room.x)
      const ddz = round2(target.z - room.z)
      if (!ddx && !ddz) return
      recordOnce()
      s.moveRoom(g.id, ddx, ddz)
    } else if (g.type === 'resize') {
      const room = s.plan.rooms.find((r) => r.id === g.id)
      const r = roomRect(room)
      const v = snap(g.edge === 'w' || g.edge === 'e' ? p.x : p.z)
      const next = { ...r }
      if (g.edge === 'w') next.x0 = Math.min(v, r.x1 - MIN_SIZE)
      if (g.edge === 'e') next.x1 = Math.max(v, r.x0 + MIN_SIZE)
      if (g.edge === 'n') next.z0 = Math.min(v, r.z1 - MIN_SIZE)
      if (g.edge === 's') next.z1 = Math.max(v, r.z0 + MIN_SIZE)
      // snap the moving edge onto a neighbour's edge
      const key = { w: 'x0', e: 'x1', n: 'z0', s: 'z1' }[g.edge]
      const axis = g.edge === 'w' || g.edge === 'e' ? 'x' : 'z'
      for (const o of others) {
        const or = roomRect(o)
        for (const t of axis === 'x' ? [or.x0, or.x1] : [or.z0, or.z1]) {
          if (Math.abs(t - next[key]) < EDGE_SNAP) next[key] = t
        }
      }
      const target = rectToRoom(room, next)
      if (target.width < MIN_SIZE - 1e-3 || target.depth < MIN_SIZE - 1e-3) return
      if (others.some((o) => roomsOverlap(target, o))) return
      if (target.width === room.width && target.depth === room.depth && target.x === room.x && target.z === room.z) return
      recordOnce()
      s.setPlan({ ...s.plan, rooms: s.plan.rooms.map((x) => (x.id === g.id ? target : x)) }, { record: false })
    } else if (g.type === 'slide') {
      const op = s.plan.openings.find((o) => o.id === g.id)
      if (!op || !g.piece) return
      const at = round2(snap(clampOnPiece(op.axis === 'x' ? p.x : p.z, op.w, g.piece), 0.05))
      if (at === op.at) return
      recordOnce()
      s.setPlan({ ...s.plan, openings: s.plan.openings.map((o) => (o.id === g.id ? { ...o, at } : o)) }, { record: false })
    }
  }

  const onUp = () => {
    const g = gesture.current
    gesture.current = null
    if (!g || !g.recorded) return
    if (g.type === 'move' || g.type === 'resize') {
      const s = st()
      const cleaned = cleanOpenings(s.plan)
      if (cleaned !== s.plan) {
        s.setPlan(cleaned, { record: false })
        toast('بعض الأبواب أو الشبابيك انشالت لأن حايطها تغيّر', 'error')
      }
      s.fitItemsToRooms()
    }
  }

  // ---- toolbar actions -----------------------------------------------------
  const addRoom = () => {
    const s = st()
    const b = planBounds(s.plan.rooms)
    const size = addType === 'bathroom' ? [2.4, 2.4] : addType === 'hall' ? [3.6, 1.6] : [3.6, 3.6]
    // try east, south, west, north of the house, aligned with its corner
    const spots = [
      [b.maxX, b.maxX + size[0], b.minZ, b.minZ + size[1]],
      [b.minX, b.minX + size[0], b.maxZ, b.maxZ + size[1]],
      [b.minX - size[0], b.minX, b.minZ, b.minZ + size[1]],
      [b.minX, b.minX + size[0], b.minZ - size[1], b.minZ],
    ]
    const id = newRoomId()
    let room = null
    for (const [x0, x1, z0, z1] of spots) {
      const candidate = R(id, addType, x0, x1, z0, z1)
      if (!s.plan.rooms.some((o) => roomsOverlap(candidate, o))) {
        room = candidate
        break
      }
    }
    if (!room) return
    const rooms = [...s.plan.rooms, room]
    // a door to the neighbour it touches most, and a window outside
    const pieces = wallPieces(rooms).filter((w) => w.room.id === room.id || isOnRoom(w, room))
    const shared = pieces.filter((w) => !w.exterior).sort((a, c) => c.b - c.a - (a.b - a.a))[0]
    const outside = pieces.filter((w) => w.exterior && isOnRoom(w, room)).sort((a, c) => c.b - c.a - (a.b - a.a))[0]
    const openings = [...(s.plan.openings || [])]
    if (shared && shared.b - shared.a >= 1.1) {
      const towardNew = (shared.axis === 'x' ? room.z : room.x) > shared.line ? 1 : -1
      openings.push({ id: newOpeningId(), type: 'door', axis: shared.axis, line: shared.line, at: round2((shared.a + shared.b) / 2), ...OPENING_DEFAULTS.door, swing: towardNew })
    }
    if (outside && outside.b - outside.a >= 1.6 && addType !== 'hall') {
      const w = addType === 'bathroom' ? 0.7 : 1.2
      openings.push({
        id: newOpeningId(), type: 'window', axis: outside.axis, line: outside.line, at: round2((outside.a + outside.b) / 2),
        ...OPENING_DEFAULTS.window, w, ...(addType === 'bathroom' ? { sill: 1.6, h: 0.6 } : {}),
      })
    }
    // a new neighbour can cover part of an old outside window: drop what no longer fits
    const next = cleanOpenings({ ...s.plan, rooms, openings })
    s.setPlan(next)
    setSel({ kind: 'room', id })
    const dropped = openings.length - next.openings.length
    toast(dropped ? `انضافت ${room.name}، وانشال شباك صار بنص الحايط الجديد` : `انضافت ${room.name}. اسحبها لمكانها`)
  }

  const selectedRoom = sel?.kind === 'room' ? plan.rooms.find((r) => r.id === sel.id) : null
  const selectedOpening = sel?.kind === 'opening' ? (plan.openings || []).find((o) => o.id === sel.id) : null

  const updateOpening = (patch) => {
    const s = st()
    const op = s.plan.openings.find((o) => o.id === sel.id)
    const next = { ...op, ...patch }
    if (patch.w !== undefined) {
      const piece = pieceFor(op, wallPieces(s.plan.rooms))
      if (!piece || patch.w > piece.b - piece.a - 0.16) return toast('ما يوسع أكثر على هذا الحايط', 'error')
      next.at = round2(clampOnPiece(op.at, patch.w, piece))
    }
    s.setPlan({ ...s.plan, openings: s.plan.openings.map((o) => (o.id === sel.id ? next : o)) })
  }

  const resizeRoom = (dim, delta) => {
    const s = st()
    const room = s.plan.rooms.find((r) => r.id === sel.id)
    const r = roomRect(room)
    const next = { ...r }
    if (dim === 'width') next.x1 = r.x1 + delta
    else next.z1 = r.z1 + delta
    const target = rectToRoom(room, next)
    if (target.width < MIN_SIZE || target.depth < MIN_SIZE) return
    if (s.plan.rooms.some((o) => o.id !== room.id && roomsOverlap(target, o))) return toast('تلزگ بغرفة ثانية، حرّك وحدة منهن أول', 'error')
    s.setPlan(cleanOpenings({ ...s.plan, rooms: s.plan.rooms.map((x) => (x.id === room.id ? target : x)) }))
    s.fitItemsToRooms()
  }

  const totalArea = plan.rooms.reduce((n, r) => n + roomArea(r), 0)
  const hint = {
    select: 'اسحب الغرفة حتى تحركها، والنقاط الذهبية على حافاتها حتى تغيّر قياسها. اضغط على باب أو شباك حتى تحركه.',
    door: 'اضغط على أي حايط حتى تحط باب.',
    window: 'اضغط على أي حايط حتى تحط شباك.',
    entrance: 'اضغط على حايط خارجي حتى تحط الباب الرئيسي.',
  }[mode]

  // font size that fits a room label
  const labelSize = (r) => Math.max(0.22, Math.min(0.42, Math.min(r.width, r.depth) * 0.11))

  return (
    <div className="plan-editor">
      <div className="pe-bar">
        <div className="pe-tools">
          {[
            ['select', 'hand', 'تحديد'],
            ['door', 'door', 'باب'],
            ['window', 'window', 'شباك'],
            ['entrance', 'home', 'باب رئيسي'],
          ].map(([m, icon, label]) => (
            <button key={m} className={`pe-tool ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
              <Icon name={icon} size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="pe-add">
          <select className="select" value={addType} onChange={(e) => setAddType(e.target.value)} aria-label="نوع الغرفة">
            {Object.entries(ROOM_TYPES).map(([k, t]) => (
              <option key={k} value={k}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="btn btn-sm" onClick={addRoom}>
            <Icon name="plus" size={16} /> غرفة
          </button>
        </div>
        <div className="pe-actions">
          <button className="icon-btn" data-tip="تراجع" onClick={() => st().undo()}>
            <Icon name="undo" size={18} />
          </button>
          <button className="btn btn-sm btn-gold" onClick={onClose}>
            <Icon name="cube" size={16} /> شوفه بالـ3D
          </button>
        </div>
      </div>

      <div className="pe-stage">
        <svg
          ref={svgRef}
          className={`pe-svg mode-${mode}`}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={onBackgroundDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <defs>
            <pattern id="pe-grid" width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#14213d" strokeOpacity="0.08" strokeWidth="0.02" />
            </pattern>
          </defs>
          <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="url(#pe-grid)" />

          {/* floors */}
          {plan.rooms.map((r) => {
            const { x0, z0 } = roomRect(r)
            const active = selectedRoom?.id === r.id
            return (
              <rect
                key={r.id}
                x={x0}
                y={z0}
                width={r.width}
                height={r.depth}
                fill={FLOOR_TINT[r.floor] || '#eee'}
                className={`pe-room ${active ? 'active' : ''}`}
                onPointerDown={(e) => {
                  if (mode !== 'select') return
                  setSel({ kind: 'room', id: r.id })
                  startGesture(e, { type: 'move', id: r.id, origin: roomRect(r) })
                }}
              />
            )
          })}

          {/* walls */}
          {walls.map((w) => (
            <line
              key={w.key}
              x1={w.axis === 'x' ? w.a : w.line}
              y1={w.axis === 'x' ? w.line : w.a}
              x2={w.axis === 'x' ? w.b : w.line}
              y2={w.axis === 'x' ? w.line : w.b}
              stroke="#14213d"
              strokeWidth={w.exterior ? WALL_T * 1.6 : WALL_T}
              strokeLinecap="square"
              pointerEvents="none"
            />
          ))}

          {/* doors and windows */}
          {(plan.openings || []).map((o) => {
            const ok = pieceFor(o, walls)
            const along = o.axis === 'x'
            const x = along ? o.at - o.w / 2 : o.line - WALL_T
            const y = along ? o.line - WALL_T : o.at - o.w / 2
            const active = selectedOpening?.id === o.id
            const swing = o.swing ?? ok?.side.inward ?? 1
            // door swing arc, matching the 3D leaf: hinged at the low-x end of walls along x,
            // and at the high-z end of walls along z
            const hx = along ? o.at - o.w / 2 : o.line
            const hz = along ? o.line : o.at + o.w / 2
            const arc = along
              ? `M ${hx} ${hz} L ${hx} ${hz + swing * o.w} A ${o.w} ${o.w} 0 0 ${swing > 0 ? 0 : 1} ${hx + o.w} ${hz}`
              : `M ${hx} ${hz} L ${hx + swing * o.w} ${hz} A ${o.w} ${o.w} 0 0 ${swing > 0 ? 0 : 1} ${hx} ${hz - o.w}`
            return (
              <g
                key={o.id}
                className={`pe-opening ${o.type} ${active ? 'active' : ''} ${ok ? '' : 'invalid'}`}
                onPointerDown={(e) => {
                  if (mode !== 'select') return
                  setSel({ kind: 'opening', id: o.id })
                  startGesture(e, { type: 'slide', id: o.id, piece: pieceFor(o, walls) })
                }}
              >
                {o.type !== 'window' && <path d={arc} className="pe-swing" />}
                <rect x={x} y={y} width={along ? o.w : WALL_T * 2} height={along ? WALL_T * 2 : o.w} className="pe-gap" />
                {o.type === 'window' && (
                  <line
                    x1={along ? o.at - o.w / 2 : o.line}
                    y1={along ? o.line : o.at - o.w / 2}
                    x2={along ? o.at + o.w / 2 : o.line}
                    y2={along ? o.line : o.at + o.w / 2}
                    className="pe-glass"
                  />
                )}
                {/* a fat invisible target that is easy to grab on a phone */}
                <rect x={x - 0.15} y={y - 0.15} width={(along ? o.w : WALL_T * 2) + 0.3} height={(along ? WALL_T * 2 : o.w) + 0.3} fill="transparent" />
              </g>
            )
          })}

          {/* labels */}
          {plan.rooms.map((r) => (
            <g key={r.id} pointerEvents="none" className="pe-label">
              <text x={r.x} y={r.z - labelSize(r) * 0.2} fontSize={labelSize(r)} textAnchor="middle" fontWeight="700">
                {r.name}
              </text>
              <text x={r.x} y={r.z + labelSize(r) * 1.05} fontSize={labelSize(r) * 0.75} textAnchor="middle" opacity="0.7">
                {formatNumber(round2(r.width))} × {formatNumber(round2(r.depth))} م · {formatNumber(roomArea(r))} م²
              </text>
            </g>
          ))}

          {/* resize handles on the selected room */}
          {selectedRoom &&
            (() => {
              const { x0, x1, z0, z1 } = roomRect(selectedRoom)
              const hs = Math.max(0.18, view.w / 70)
              return [
                ['n', selectedRoom.x, z0],
                ['s', selectedRoom.x, z1],
                ['w', x0, selectedRoom.z],
                ['e', x1, selectedRoom.z],
              ].map(([edge, cx, cy]) => (
                <circle
                  key={edge}
                  cx={cx}
                  cy={cy}
                  r={hs}
                  className={`pe-handle edge-${edge}`}
                  onPointerDown={(e) => startGesture(e, { type: 'resize', id: selectedRoom.id, edge })}
                />
              ))
            })()}
        </svg>
      </div>

      <div className="pe-panel">
        {!selectedRoom && !selectedOpening && (
          <div className="pe-info">
            <strong>
              {formatNumber(plan.rooms.length)} غرف · {formatNumber(Math.round(totalArea))} م²
            </strong>
            <span>{hint}</span>
          </div>
        )}

        {selectedRoom && (
          <div className="pe-form">
            <input
              className="input"
              value={selectedRoom.name}
              maxLength={40}
              aria-label="اسم الغرفة"
              onFocus={() => st().record()}
              onChange={(e) => st().updateRoom(selectedRoom.id, { name: e.target.value }, { record: false })}
            />
            <select
              className="select"
              value={selectedRoom.type}
              aria-label="نوع الغرفة"
              onChange={(e) => {
                const t = ROOM_TYPES[e.target.value]
                const wasDefault = Object.values(ROOM_TYPES).some((x) => x.name === selectedRoom.name)
                st().updateRoom(selectedRoom.id, { type: e.target.value, ...(wasDefault ? { name: t.name } : {}), floor: t.floor, wallColor: t.wallColor })
              }}
            >
              {Object.entries(ROOM_TYPES).map(([k, t]) => (
                <option key={k} value={k}>
                  {t.name}
                </option>
              ))}
            </select>
            {[['width', 'العرض'], ['depth', 'الطول']].map(([dim, label]) => (
              <div key={dim} className="stepper">
                <span>{label}</span>
                <button onClick={() => resizeRoom(dim, -0.1)} aria-label={`نقّص ${label}`}>
                  <Icon name="minus" size={14} />
                </button>
                <strong>{fmt(selectedRoom[dim])}</strong>
                <button onClick={() => resizeRoom(dim, 0.1)} aria-label={`زيد ${label}`}>
                  <Icon name="plus" size={14} />
                </button>
              </div>
            ))}
            <button
              className="btn btn-sm btn-ghost"
              disabled={plan.rooms.length < 2}
              onClick={() => {
                st().removeRoom(selectedRoom.id)
                setSel(null)
              }}
            >
              <Icon name="trash" size={16} /> احذف الغرفة
            </button>
          </div>
        )}

        {selectedOpening && (
          <div className="pe-form">
            <div className="seg">
              {Object.entries(OPENING_NAMES).map(([t, label]) => (
                <button
                  key={t}
                  className={selectedOpening.type === t ? 'active' : ''}
                  onClick={() => {
                    const d = OPENING_DEFAULTS[t]
                    updateOpening({ type: t, h: d.h, ...(t === 'window' ? { sill: d.sill } : {}) })
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="stepper">
              <span>العرض</span>
              <button onClick={() => selectedOpening.w > 0.55 && updateOpening({ w: round2(selectedOpening.w - 0.1) })} aria-label="نقّص العرض">
                <Icon name="minus" size={14} />
              </button>
              <strong>{fmt(selectedOpening.w)}</strong>
              <button onClick={() => updateOpening({ w: round2(selectedOpening.w + 0.1) })} aria-label="زيد العرض">
                <Icon name="plus" size={14} />
              </button>
            </div>
            {selectedOpening.type !== 'window' && (
              <button className="btn btn-sm btn-ghost" onClick={() => updateOpening({ swing: -(selectedOpening.swing ?? 1) })}>
                <Icon name="rotateL" size={16} /> اقلب جهة الفتح
              </button>
            )}
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                const s = st()
                s.setPlan({ ...s.plan, openings: s.plan.openings.filter((o) => o.id !== selectedOpening.id) })
                setSel(null)
              }}
            >
              <Icon name="trash" size={16} /> احذف
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Is a wall piece one of this room's own edges? */
function isOnRoom(w, room) {
  const r = roomRect(room)
  if (w.axis === 'x') return (Math.abs(w.line - r.z0) < 1e-3 || Math.abs(w.line - r.z1) < 1e-3) && w.a >= r.x0 - 1e-3 && w.b <= r.x1 + 1e-3
  return (Math.abs(w.line - r.x0) < 1e-3 || Math.abs(w.line - r.x1) < 1e-3) && w.a >= r.z0 - 1e-3 && w.b <= r.z1 + 1e-3
}
