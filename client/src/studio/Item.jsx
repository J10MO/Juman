import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FurnitureModel } from '../three/models/index.jsx'
import { LIFT, angleDelta, rotateXZ } from './placement.js'
import { drag, spawnPoses, useStudio } from './store.js'
import { dragApi } from './dragApi.js'

/** uid -> THREE.Group, so children can follow their host and indicators can find items. */
export const registry = new Map()

const GRAVITY = 9.81
const damp = THREE.MathUtils.damp

/**
 * Shared motion model for anything that can be carried around:
 * spring lift while held, velocity-based sway, gravity + bounce on release,
 * and a little squash on impact.
 */
export function useCarryMotion({ outer, sway, product, getTarget }) {
  const st = useRef({ vy: 0, px: null, pz: null, tiltX: 0, tiltZ: 0, squash: 0, t: 0 })
  const isRug = product.kind === 'rug'

  useFrame((_, rawDt) => {
    const g = outer.current
    const s = sway.current
    if (!g || !s) return
    const dt = Math.min(rawDt, 1 / 30)
    const m = st.current
    m.t += dt
    const target = getTarget()
    if (!target) return
    const { x, y, z, rot, held, glued, invalid } = target

    // horizontal motion
    const lam = held ? 18 : glued ? 40 : 11
    g.position.x = damp(g.position.x, x, lam, dt)
    g.position.z = damp(g.position.z, z, lam, dt)
    g.rotation.y += angleDelta(g.rotation.y, rot) * (1 - Math.exp(-(held ? 14 : 10) * dt))

    // vertical: spring up while held, gravity when let go, bounce on landing
    let py = g.position.y
    if (held) m.vy += ((y - py) * 170 - m.vy * 18) * dt
    else if (py > y + 0.0005) m.vy -= GRAVITY * dt * 1.15
    else if (m.vy > 0 && py >= y) m.vy *= 0.9
    py += m.vy * dt
    if (!held && py <= y) {
      const impact = -m.vy
      py = y
      if (impact > 0.45 && !isRug) {
        m.vy = impact * 0.28
        m.squash = Math.min(0.07, impact * 0.025)
      } else m.vy = Math.max(0, m.vy)
    }
    g.position.y = py

    // sway: the object trails behind the hand that carries it
    const vx = m.px === null ? 0 : (g.position.x - m.px) / dt
    const vz = m.pz === null ? 0 : (g.position.z - m.pz) / dt
    m.px = g.position.x
    m.pz = g.position.z
    const [lvx, lvz] = rotateXZ(vx, vz, -g.rotation.y)
    const k = isRug ? 0.02 : 0.07
    const tx = held ? THREE.MathUtils.clamp(lvz * k, -0.22, 0.22) : 0
    const tz = held ? THREE.MathUtils.clamp(-lvx * k, -0.22, 0.22) : 0
    m.tiltX = damp(m.tiltX, tx, 10, dt)
    m.tiltZ = damp(m.tiltZ, tz, 10, dt)
    const wobble = invalid ? Math.sin(m.t * 42) * 0.035 : 0
    s.rotation.set(m.tiltX, wobble, m.tiltZ)

    m.squash = damp(m.squash, 0, 9, dt)
    const sq = m.squash * Math.cos(m.t * 30)
    s.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5)
  })
}

export function Item({ item, product }) {
  const outer = useRef()
  const sway = useRef()
  const night = useStudio((s) => s.night)
  const h = product.dims.h

  useLayoutEffect(() => {
    const g = outer.current
    const spawn = spawnPoses.get(item.uid)
    if (spawn) {
      g.position.set(spawn.x, spawn.y, spawn.z)
      spawnPoses.delete(item.uid)
    } else if (!item.parent) {
      g.position.set(item.x, 0, item.z)
    } else {
      const host = registry.get(item.parent)
      const hp = useStudio.getState().items.find((i) => i.uid === item.parent)
      if (host && hp) {
        const [dx, dz] = rotateXZ(item.x, item.z, host.rotation.y)
        g.position.set(host.position.x + dx, host.position.y + 0.3, host.position.z + dz)
      }
    }
    g.rotation.y = item.parent ? (registry.get(item.parent)?.rotation.y || 0) + item.rot : item.rot
    registry.set(item.uid, g)
    return () => {
      if (registry.get(item.uid) === g) registry.delete(item.uid)
    }
    // only on mount: afterwards the frame loop drives the transform
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useCarryMotion({
    outer,
    sway,
    product,
    getTarget: () => {
      if (drag.active && drag.mode === 'move' && drag.uid === item.uid) {
        return { x: drag.x, z: drag.z, y: drag.y + (product.kind === 'rug' ? 0.08 : LIFT), rot: drag.rot, held: true, invalid: !drag.valid }
      }
      if (item.parent) {
        const host = registry.get(item.parent)
        if (!host) return null
        const s = useStudio.getState()
        const hostItem = s.items.find((i) => i.uid === item.parent)
        const surface = hostItem ? s.productMap[hostItem.productId]?.surfaceHeight || 0 : 0
        const [dx, dz] = rotateXZ(item.x, item.z, host.rotation.y)
        return {
          x: host.position.x + dx,
          z: host.position.z + dz,
          y: host.position.y + surface,
          rot: host.rotation.y + item.rot,
          glued: true,
        }
      }
      return { x: item.x, z: item.z, y: 0, rot: item.rot }
    },
  })

  return (
    <group
      ref={outer}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.stopPropagation()
        dragApi.pressItem(item.uid, e.nativeEvent)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (!drag.active) document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        if (!drag.active) document.body.style.cursor = ''
      }}
      userData={{ uid: item.uid }}
    >
      {/* sway pivots around the middle of the object */}
      <group position={[0, h / 2, 0]}>
        <group ref={sway}>
          <group position={[0, -h / 2, 0]}>
            <FurnitureModel product={product} color={item.color} lit={night} />
          </group>
        </group>
      </group>
    </group>
  )
}
