import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { FurnitureModel } from '../three/models/index.jsx'
import {
  LIFT, evaluate, extents, findFreeSpot, hostsOf, indexItems, newUid, pointInRect, rectOf, worldOf,
} from './placement.js'
import { drag, spawnPoses, useStudio } from './store.js'
import { WALL_T, planBounds } from './plan.js'
import { dragApi } from './dragApi.js'
import { registry, useCarryMotion } from './Item.jsx'

const START_DISTANCE = 5 // px the pointer must travel before a press becomes a drag
const ROT_STEP = Math.PI / 12

/**
 * Owns every drag: moving items already in the room and dropping new ones
 * from the catalogue. Listens on window so drags keep working even when the
 * pointer leaves the canvas.
 */
export function DragController() {
  const { camera, gl, controls } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const pending = useRef(null) // press that has not moved enough to become a drag yet

  useEffect(() => {
    const ray = (cx, cy) => {
      const r = gl.domElement.getBoundingClientRect()
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      return raycaster.ray
    }
    const hitY = (rr, y) => {
      plane.constant = -y
      return rr.intersectPlane(plane, new THREE.Vector3())
    }
    const isOverCanvas = (cx, cy) => {
      const el = document.elementFromPoint(cx, cy)
      return el === gl.domElement
    }

    const compute = () => {
      const s = useStudio.getState()
      const rr = ray(drag.clientX, drag.clientY)
      let hostUid = null
      let px
      let pz
      if (drag.product.kind === 'small') {
        let best = null
        for (const h of hostsOf(s.items, s.productMap, drag.uid)) {
          const hp = s.productMap[h.productId]
          const p = hitY(rr, hp.surfaceHeight)
          if (p && pointInRect(p.x, p.z, rectOf(hp, h.x, h.z, h.rot), 0.04)) {
            const d = rr.origin.distanceTo(p)
            if (!best || d < best.d) best = { d, uid: h.uid, p }
          }
        }
        if (best) {
          hostUid = best.uid
          px = best.p.x
          pz = best.p.z
        }
      }
      if (!hostUid) {
        const p = hitY(rr, 0)
        if (!p) return
        px = p.x + drag.offsetX
        pz = p.z + drag.offsetZ
      }
      const res = evaluate(s, { uid: drag.uid, product: drag.product, x: px, z: pz, rot: drag.rot, hostUid })
      drag.x = res.x
      drag.z = res.z
      drag.y = res.y
      drag.valid = res.valid
      drag.parent = res.parent
      drag.local = res.local
      drag.roomId = res.roomId || null
    }

    const activate = (p) => {
      const s = useStudio.getState()
      if (p.kind === 'item') {
        const it = s.items.find((i) => i.uid === p.uid)
        if (!it) return
        const product = s.productMap[it.productId]
        const w = worldOf(it, indexItems(s.items), s.productMap)
        Object.assign(drag, {
          active: true, mode: 'move', uid: it.uid, product, color: it.color,
          x: w.x, z: w.z, y: w.y, rot: w.rot, valid: true, parent: it.parent, local: null,
          startX: w.x, startZ: w.z, startRot: w.rot, offsetX: 0, offsetZ: 0, overCanvas: true,
        })
        if (product.kind !== 'small') {
          const hit = hitY(ray(p.startX, p.startY), 0)
          if (hit) {
            drag.offsetX = w.x - hit.x
            drag.offsetZ = w.z - hit.z
          }
        }
        useStudio.setState({ draggingUid: it.uid, selected: it.uid })
      } else {
        Object.assign(drag, {
          active: true, mode: 'new', uid: null, product: p.product, color: p.color || p.product.colors[0],
          rot: 0, valid: true, parent: null, local: null, offsetX: 0, offsetZ: 0, overCanvas: false, y: 0,
        })
        useStudio.setState({ draggingUid: 'new', newDragProduct: p.product, overCanvas: false, selected: null })
      }
      if (controls) controls.enabled = false
      document.body.classList.add('is-dragging')
      document.body.style.cursor = 'grabbing'
    }

    const end = () => {
      drag.active = false
      drag.mode = null
      drag.uid = null
      drag.endedAt = performance.now()
      if (controls) controls.enabled = true
      document.body.classList.remove('is-dragging')
      document.body.style.cursor = ''
      useStudio.setState({ draggingUid: null, newDragProduct: null, overCanvas: false })
    }

    /** Resolve the final spot: the hovered spot, or the nearest free one if that's blocked. */
    const resolveDrop = () => {
      if (drag.valid) return { x: drag.x, z: drag.z, rot: drag.rot, parent: drag.parent, local: drag.local }
      if (drag.parent) return null
      const s = useStudio.getState()
      const alt = findFreeSpot(s, { uid: drag.uid, product: drag.product, x: drag.x, z: drag.z, rot: drag.rot }, 1.4)
      return alt ? { x: alt.x, z: alt.z, rot: alt.rot, parent: null, local: null } : null
    }

    const finish = () => {
      const s = useStudio.getState()
      if (drag.mode === 'move') {
        const spot = resolveDrop()
        const it = s.items.find((i) => i.uid === drag.uid)
        if (spot && it) {
          const patch = spot.parent
            ? { x: spot.local.x, z: spot.local.z, rot: spot.local.rot, parent: spot.parent }
            : { x: spot.x, z: spot.z, rot: spot.rot, parent: null }
          const changed =
            Math.abs(patch.x - it.x) > 1e-4 || Math.abs(patch.z - it.z) > 1e-4 ||
            Math.abs(patch.rot - it.rot) > 1e-4 || (patch.parent || null) !== (it.parent || null)
          if (changed) s.updateItem(it.uid, patch)
        }
      } else if (drag.mode === 'new' && drag.overCanvas) {
        const spot = resolveDrop()
        if (spot) {
          const uid = newUid()
          spawnPoses.set(uid, { x: drag.x, y: drag.y + LIFT, z: drag.z })
          const pos = spot.parent ? spot.local : spot
          s.addItem({
            uid, productId: drag.product.id, x: pos.x, z: pos.z, rot: pos.rot,
            color: drag.color, parent: spot.parent || null,
          })
          // hand the ghost's current pose to the new item so it continues smoothly
          const ghost = ghostRef.current
          if (ghost) spawnPoses.set(uid, { x: ghost.position.x, y: ghost.position.y, z: ghost.position.z })
        }
      }
      end()
    }

    const onMove = (e) => {
      if (pending.current && !drag.active) {
        const p = pending.current
        if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < START_DISTANCE) return
        activate(p)
        pending.current = null
      }
      if (!drag.active) return
      drag.clientX = e.clientX
      drag.clientY = e.clientY
      if (drag.mode === 'new') {
        const over = isOverCanvas(e.clientX, e.clientY)
        if (over !== drag.overCanvas) {
          drag.overCanvas = over
          useStudio.setState({ overCanvas: over })
        }
        if (!over) return
      }
      compute()
    }

    const onUp = () => {
      const p = pending.current
      pending.current = null
      if (p && !drag.active) {
        // a click, not a drag
        if (p.kind === 'item') useStudio.getState().select(p.uid)
        else useStudio.getState().addProductNear(p.product, undefined, undefined, p.color)
        return
      }
      if (drag.active) finish()
    }

    const onCancel = () => {
      pending.current = null
      if (drag.active) end()
    }

    const onWheel = (e) => {
      if (!drag.active) return
      e.preventDefault()
      e.stopPropagation()
      dragApi.rotateDrag(Math.sign(e.deltaY) * ROT_STEP)
    }

    dragApi.pressItem = (uid, e) => {
      pending.current = { kind: 'item', uid, startX: e.clientX, startY: e.clientY }
      drag.clientX = e.clientX
      drag.clientY = e.clientY
      // stop the camera from orbiting while we decide whether this is a drag
      if (controls) controls.enabled = false
    }
    dragApi.pressProduct = (product, e, color) => {
      pending.current = { kind: 'product', product, color, startX: e.clientX, startY: e.clientY }
    }
    dragApi.rotateDrag = (delta) => {
      if (!drag.active) return false
      drag.rot = Math.round((drag.rot + delta) / ROT_STEP) * ROT_STEP
      if (drag.mode === 'move' || drag.overCanvas) compute()
      return true
    }
    dragApi.cancel = onCancel

    const reEnable = () => {
      if (!drag.active && controls) controls.enabled = true
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointerup', reEnable)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('blur', onCancel)
    gl.domElement.addEventListener('wheel', onWheel, { passive: false, capture: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointerup', reEnable)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('blur', onCancel)
      gl.domElement.removeEventListener('wheel', onWheel, { capture: true })
    }
  }, [camera, gl, controls, raycaster, ndc, plane])

  return (
    <>
      <NewItemGhost />
      <Footprint />
      <Guides />
    </>
  )
}

const ghostRef = { current: null }

/** The real model following the cursor while dragging a new product in. */
function NewItemGhost() {
  const product = useStudio((s) => s.newDragProduct)
  const over = useStudio((s) => s.overCanvas)
  const night = useStudio((s) => s.night)
  if (!product) return null
  return <GhostBody key={product.id} product={product} visible={over} night={night} />
}

function GhostBody({ product, visible, night }) {
  const outer = useRef()
  const sway = useRef()
  const placed = useRef(false)
  useEffect(() => {
    ghostRef.current = outer.current
    return () => {
      if (ghostRef.current === outer.current) ghostRef.current = null
    }
  }, [])
  useCarryMotion({
    outer,
    sway,
    product,
    getTarget: () => {
      if (!drag.overCanvas) return null
      if (!placed.current) {
        // appear right under the cursor, then follow smoothly
        outer.current.position.set(drag.x, drag.y + LIFT + 0.4, drag.z)
        placed.current = true
      }
      return { x: drag.x, z: drag.z, y: drag.y + (product.kind === 'rug' ? 0.08 : LIFT), rot: drag.rot, held: true, invalid: !drag.valid }
    },
  })
  const h = product.dims.h
  return (
    <group ref={outer} visible={visible}>
      <group position={[0, h / 2, 0]}>
        <group ref={sway}>
          <group position={[0, -h / 2, 0]}>
            <FurnitureModel product={product} color={drag.color} lit={night} />
          </group>
        </group>
      </group>
    </group>
  )
}

const OK = new THREE.Color('#1f9d8b')
const BAD = new THREE.Color('#d6453d')
const SEL = new THREE.Color('#c8a45c')

/** Glowing outline on the floor: where the dragged item will land, or what's selected. */
function Footprint() {
  const group = useRef()
  const fillMat = useRef()
  const lineMat = useRef()
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const r = 0.06
    shape.moveTo(-0.5 + r, -0.5)
    shape.lineTo(0.5 - r, -0.5)
    shape.quadraticCurveTo(0.5, -0.5, 0.5, -0.5 + r)
    shape.lineTo(0.5, 0.5 - r)
    shape.quadraticCurveTo(0.5, 0.5, 0.5 - r, 0.5)
    shape.lineTo(-0.5 + r, 0.5)
    shape.quadraticCurveTo(-0.5, 0.5, -0.5, 0.5 - r)
    shape.lineTo(-0.5, -0.5 + r)
    shape.quadraticCurveTo(-0.5, -0.5, -0.5 + r, -0.5)
    return {
      fill: new THREE.ShapeGeometry(shape, 6),
      line: new THREE.BufferGeometry().setFromPoints(shape.getPoints(10)),
    }
  }, [])

  useFrame(({ clock }) => {
    const g = group.current
    const s = useStudio.getState()
    let product
    let x
    let z
    let y
    let rot
    let color
    let alpha
    if (drag.active && (drag.mode === 'move' || drag.overCanvas)) {
      product = drag.product
      x = drag.x
      z = drag.z
      y = drag.y
      rot = drag.rot
      color = drag.valid ? OK : BAD
      alpha = 0.28
    } else if (s.selected && registry.get(s.selected)) {
      const it = s.items.find((i) => i.uid === s.selected)
      product = it && s.productMap[it.productId]
      const obj = registry.get(s.selected)
      x = obj.position.x
      z = obj.position.z
      y = it?.parent ? obj.position.y : 0
      rot = obj.rotation.y
      color = SEL
      alpha = 0.12 + Math.sin(clock.elapsedTime * 3) * 0.04
    }
    if (!product) {
      g.visible = false
      return
    }
    g.visible = true
    g.position.set(x, y + (product.kind === 'rug' ? 0.02 : 0.006), z)
    g.rotation.set(-Math.PI / 2, 0, rot)
    g.scale.set(product.dims.w + 0.08, product.dims.d + 0.08, 1)
    fillMat.current.color.copy(color)
    fillMat.current.opacity = alpha
    lineMat.current.color.copy(color)
  })

  return (
    <group ref={group} visible={false} renderOrder={5}>
      <mesh geometry={geometry.fill}>
        <meshBasicMaterial ref={fillMat} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <lineLoop geometry={geometry.line}>
        <lineBasicMaterial ref={lineMat} toneMapped={false} />
      </lineLoop>
    </group>
  )
}

/** Measuring tape from the dragged item to the two nearest walls. */
function Guides() {
  const show = useStudio((s) => s.guides)
  const wrap = useRef()
  const lines = [useRef(), useRef()]
  const anchors = [useRef(), useRef()]
  const labels = [useRef(), useRef()]

  useFrame(() => {
    const g = wrap.current
    if (!g) return
    const active =
      drag.active && !drag.parent && drag.product?.kind !== 'small' && (drag.mode === 'move' || drag.overCanvas)
    g.visible = Boolean(active)
    if (!active) {
      labels.forEach((l) => l.current && (l.current.style.opacity = '0'))
      return
    }
    const { plan } = useStudio.getState()
    const room = plan.rooms.find((r) => r.id === drag.roomId) || plan.rooms[0]
    const [ex, ez] = extents(drag.product.dims.w / 2, drag.product.dims.d / 2, drag.rot)
    // measure to the inner face of the walls
    const x0 = room.x - room.width / 2 + WALL_T / 2
    const x1 = room.x + room.width / 2 - WALL_T / 2
    const z0 = room.z - room.depth / 2 + WALL_T / 2
    const z1 = room.z + room.depth / 2 - WALL_T / 2
    const left = drag.x - ex - x0
    const right = x1 - (drag.x + ex)
    const back = drag.z - ez - z0
    const front = z1 - (drag.z + ez)
    const gx = left < right ? { d: left, from: x0 } : { d: right, from: drag.x + ex }
    const gz = back < front ? { d: back, from: z0 } : { d: front, from: drag.z + ez }

    const place = (i, d, cx, cz, alongX) => {
      const visible = d > 0.02
      const line = lines[i].current
      line.visible = visible
      line.position.set(cx, 0.015, cz)
      line.scale.set(alongX ? Math.max(d, 0.001) : 1, 1, alongX ? 1 : Math.max(d, 0.001))
      anchors[i].current.position.set(cx, 0.02, cz)
      if (labels[i].current) {
        labels[i].current.style.opacity = visible ? '1' : '0'
        labels[i].current.textContent = `${Math.round(d * 100)} سم`
      }
    }
    place(0, gx.d, gx.from + gx.d / 2, drag.z, true)
    place(1, gz.d, drag.x, gz.from + gz.d / 2, false)
  })

  if (!show) return null
  return (
    <group ref={wrap} visible={false}>
      {[0, 1].map((i) => (
        <group key={i}>
          <mesh ref={lines[i]}>
            <boxGeometry args={[i === 0 ? 1 : 0.012, 0.004, i === 0 ? 0.012 : 1]} />
            <meshBasicMaterial color="#c8a45c" toneMapped={false} />
          </mesh>
          <group ref={anchors[i]}>
            <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
              <div ref={labels[i]} className="measure-label" />
            </Html>
          </group>
        </group>
      ))}
    </group>
  )
}

/** Smoothly flies the camera to a preset when the toolbar asks for one. */
export function CameraRig() {
  const cmd = useStudio((s) => s.cameraCmd)
  const rooms = useStudio((s) => s.plan.rooms)
  const { camera, controls, size } = useThree()
  const tween = useRef(null)
  const portrait = size.width < size.height

  useEffect(() => {
    const b = planBounds(rooms)
    const room = rooms.find((r) => r.id === cmd.roomId)
    // Pull the camera back on tall/narrow screens so everything fits.
    const k = portrait ? 1.6 : 1
    let p
    if (cmd.name === 'room' && room) {
      const M = Math.max(room.width, room.depth) * k
      p = { pos: [room.x + room.width * 0.45, M * 0.95 + 1.2, room.z + room.depth * 0.8 + 1.2], target: [room.x, 0.4, room.z] }
    } else if (cmd.name === 'top') {
      const M = Math.max(b.width, b.depth) * k
      p = { pos: [b.cx, M * 1.55 + 2, b.cz + 0.01], target: [b.cx, 0, b.cz] }
    } else if (cmd.name === 'front') {
      const M = Math.max(b.width, b.depth) * k
      p = { pos: [b.cx, 1.5, b.maxZ + M * 0.75], target: [b.cx, 0.9, b.cz] }
    } else if (cmd.name === 'corner') {
      // the chosen room, else the living room, else the biggest room that isn't a corridor
      const r =
        rooms.find((x) => x.id === cmd.roomId) ||
        rooms.find((x) => x.type === 'living') ||
        [...rooms].filter((x) => x.type !== 'hall').sort((a, c) => c.width * c.depth - a.width * a.depth)[0] ||
        rooms[0]
      p = {
        pos: [r.x - r.width / 2 + 0.6, 1.65, r.z + r.depth / 2 - 0.6],
        target: [r.x + r.width * 0.1, 0.8, r.z - r.depth * 0.1],
      }
    } else {
      const M = Math.max(b.width, b.depth) * k
      p = { pos: [b.cx + b.width * 0.5, M * 0.85 + 0.5, b.maxZ + b.depth * 0.45 + 1.5], target: [b.cx, 0.4, b.cz] }
    }
    tween.current = { pos: new THREE.Vector3(...p.pos), target: new THREE.Vector3(...p.target) }
    // rooms only matter for the first framing / explicit commands
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd, portrait])

  useEffect(() => {
    if (!controls) return
    const stop = () => (tween.current = null)
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useFrame((_, dt) => {
    const t = tween.current
    if (!t || !controls) return
    const k = 1 - Math.exp(-5 * dt)
    camera.position.lerp(t.pos, k)
    controls.target.lerp(t.target, k)
    controls.update()
    if (camera.position.distanceTo(t.pos) < 0.01 && controls.target.distanceTo(t.target) < 0.01) tween.current = null
  })
  return null
}
