import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { floorTexture } from './textures.js'
import { WALL_H, WALL_T, buildWalls, roomArea } from '../studio/plan.js'
import { Wood } from './models/materials.jsx'
import { formatNumber } from '../lib/format.js'

const unitBox = new THREE.BoxGeometry(1, 1, 1)
const LOW_EXTERIOR = 0.06
const LOW_INTERIOR = 0.4
const damp = THREE.MathUtils.damp

/**
 * A whole house (or a single room): floors, walls with doors and windows, and
 * room labels. Walls between the camera and the rooms lower themselves; in an
 * overview the inner walls drop to waist height so the floor plan reads.
 */
export function House({ plan, night, walls = 'auto', activeRoom, onFloorClick }) {
  const built = useMemo(() => buildWalls(plan), [plan])
  const heights = useRef(new Map()) // group key -> current height factor
  const skinRefs = useRef([])
  const decorRefs = useRef([])
  const postRefs = useRef([])
  const labelRefs = useRef([])

  // Which wall groups touch each corner post.
  const postGroups = useMemo(
    () =>
      built.posts.map((p) =>
        [
          ...new Set(
            built.skins
              .filter((s) => {
                const half = s.len / 2
                const ends = s.axis === 'x' ? [[s.x - half, s.z], [s.x + half, s.z]] : [[s.x, s.z - half], [s.x, s.z + half]]
                return ends.some(([ex, ez]) => Math.abs(ex - p.x) < WALL_T && Math.abs(ez - p.z) < WALL_T)
              })
              .map((s) => s.group),
          ),
        ],
      ),
    [built],
  )

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const overview = camera.position.y > 3.2
    const targets = new Map()
    for (const s of built.skins) {
      if (targets.has(s.group) && targets.get(s.group) < 1) continue
      let t = 1
      if (walls === 'down') t = LOW_EXTERIOR
      else if (walls === 'auto') {
        if (s.exterior) {
          const outside = (camera.position.x - s.x) * s.normal[0] + (camera.position.z - s.z) * s.normal[1] > 0
          if (outside) t = LOW_EXTERIOR
        } else if (overview) t = LOW_INTERIOR
      }
      targets.set(s.group, Math.min(t, targets.get(s.group) ?? 1))
    }
    const h = heights.current
    for (const [k, t] of targets) h.set(k, damp(h.get(k) ?? t, t, 7, dt))

    skinRefs.current.forEach((m, i) => {
      if (!m) return
      const s = built.skins[i]
      const f = h.get(s.group) ?? 1
      m.scale.y = Math.max(0.001, (s.y1 - s.y0) * f)
      m.position.y = (s.y0 + (s.y1 - s.y0) / 2) * f
      m.visible = f > 0.02 || s.y0 === 0
    })
    decorRefs.current.forEach((g, i) => {
      if (!g) return
      const f = h.get(built.decor[i].group) ?? 1
      g.scale.y = f
      g.visible = f > 0.3
    })
    postRefs.current.forEach((m, i) => {
      if (!m) return
      const f = Math.min(1, ...postGroups[i].map((k) => h.get(k) ?? 1))
      m.scale.y = WALL_H * f
      m.position.y = (WALL_H * f) / 2
    })
    labelRefs.current.forEach((el) => {
      if (el) el.style.opacity = overview && plan.rooms.length > 1 ? '1' : '0'
    })
  })

  return (
    <group>
      {plan.rooms.map((r) => (
        <RoomFloor key={r.id} room={r} active={activeRoom === r.id && plan.rooms.length > 1} onClick={onFloorClick} />
      ))}
      {/* ground around the house so shadows have somewhere to land */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color={night ? '#141820' : '#e7e1d6'} roughness={1} />
      </mesh>

      {built.skins.map((s, i) => (
        <mesh
          key={s.key}
          ref={(m) => (skinRefs.current[i] = m)}
          geometry={unitBox}
          position={[s.x, (s.y0 + s.y1) / 2, s.z]}
          scale={[s.axis === 'x' ? s.len : WALL_T / 2, s.y1 - s.y0, s.axis === 'x' ? WALL_T / 2 : s.len]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={s.color} roughness={0.95} />
        </mesh>
      ))}

      {built.posts.map((p, i) => (
        <mesh
          key={`${p.x}:${p.z}`}
          ref={(m) => (postRefs.current[i] = m)}
          geometry={unitBox}
          position={[p.x, WALL_H / 2, p.z]}
          scale={[WALL_T - 0.006, WALL_H, WALL_T - 0.006]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#e4ddd0" roughness={0.95} />
        </mesh>
      ))}

      {built.decor.map((d, i) => (
        <group key={d.key} ref={(g) => (decorRefs.current[i] = g)}>
          {d.type === 'window' ? <WindowFrame d={d} night={night} /> : <Doorway d={d} />}
        </group>
      ))}

      {plan.rooms.map((r, i) => (
        <group key={r.id} position={[r.x, 0.05, r.z]}>
          <Html center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <div ref={(el) => (labelRefs.current[i] = el)} className="room-label">
              <strong>{r.name}</strong>
              <span>{formatNumber(roomArea(r))} م²</span>
            </div>
          </Html>
        </group>
      ))}

      {night &&
        plan.rooms.map((r) => (
          <pointLight
            key={r.id}
            position={[r.x, WALL_H - 0.2, r.z]}
            color="#ffd9a8"
            intensity={0.9}
            distance={Math.max(r.width, r.depth) * 1.4}
            decay={2}
          />
        ))}
    </group>
  )
}

function RoomFloor({ room, active, onClick }) {
  const map = useMemo(() => {
    const t = floorTexture(room.floor).clone()
    t.repeat.set(room.width / 4, room.depth / 4)
    t.offset.set((room.x - room.width / 2) / 4, (room.z - room.depth / 2) / 4)
    t.needsUpdate = true
    return t
  }, [room.floor, room.width, room.depth, room.x, room.z])
  const outline = useMemo(() => {
    const w = room.width / 2 - WALL_T / 2 - 0.04
    const d = room.depth / 2 - WALL_T / 2 - 0.04
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w, 0, -d), new THREE.Vector3(w, 0, -d), new THREE.Vector3(w, 0, d), new THREE.Vector3(-w, 0, d),
    ])
  }, [room.width, room.depth])
  const marble = room.floor === 'marble'
  return (
    <group position={[room.x, 0, room.z]}>
      {/* the floor runs under the walls (+ wall thickness) so doorways have no gaps */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={(e) => onClick?.(e, room.id)} name="floor">
        <planeGeometry args={[room.width + WALL_T * 0.5, room.depth + WALL_T * 0.5]} />
        <meshPhysicalMaterial
          map={map}
          roughness={marble ? 0.18 : 0.5}
          clearcoat={marble ? 0.6 : 0.3}
          clearcoatRoughness={marble ? 0.1 : 0.35}
          polygonOffset
          polygonOffsetFactor={1}
        />
      </mesh>
      {active && (
        <lineLoop geometry={outline} position={[0, 0.008, 0]}>
          <lineBasicMaterial color="#c8a45c" toneMapped={false} />
        </lineLoop>
      )}
    </group>
  )
}

function WindowFrame({ d, night }) {
  const rotY = d.axis === 'x' ? 0 : Math.PI / 2
  // the sky faces into the house only, so it's invisible from outside
  const skyFacing = d.axis === 'x' ? (d.normal[1] > 0 ? Math.PI : 0) : d.normal[0] > 0 ? -Math.PI / 2 : Math.PI / 2
  const skyOffset = 0.2
  return (
    <group position={[d.x, d.sill + d.h / 2, d.z]}>
      <group rotation={[0, rotY, 0]}>
        {[
          [d.w, 0.05, 0, d.h / 2 - 0.025],
          [d.w, 0.05, 0, -d.h / 2 + 0.025],
          [0.05, d.h, -d.w / 2 + 0.025, 0],
          [0.05, d.h, d.w / 2 - 0.025, 0],
          [0.035, d.h, 0, 0],
        ].map(([w, h, x, y], i) => (
          <mesh key={i} position={[x, y, 0]} castShadow>
            <boxGeometry args={[w, h, WALL_T + 0.02]} />
            <meshStandardMaterial color="#fbfaf7" roughness={0.4} />
          </mesh>
        ))}
        <mesh>
          <planeGeometry args={[d.w - 0.05, d.h - 0.05]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.02} transparent opacity={0.15} clearcoat={1} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {d.exterior && (
        <mesh
          position={[d.normal[0] * skyOffset, 0, d.normal[1] * skyOffset]}
          rotation={[0, skyFacing, 0]}
        >
          <planeGeometry args={[d.w + 0.4, d.h + 0.4]} />
          <meshBasicMaterial color={night ? '#0e1830' : '#cfe4f5'} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

function Doorway({ d }) {
  const rotY = d.axis === 'x' ? 0 : Math.PI / 2
  const leafW = d.w - 0.04
  // local +z is world +z for walls along x, and world +x for walls along z (after the π/2 turn)
  const swing = d.inward
  return (
    <group position={[d.x, 0, d.z]} rotation={[0, rotY, 0]}>
      {/* casing */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (d.w / 2 + 0.03), d.h / 2, 0]} castShadow>
          <boxGeometry args={[0.06, d.h + 0.06, WALL_T + 0.03]} />
          <meshStandardMaterial color="#f7f4ee" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, d.h + 0.03, 0]} castShadow>
        <boxGeometry args={[d.w + 0.12, 0.06, WALL_T + 0.03]} />
        <meshStandardMaterial color="#f7f4ee" roughness={0.5} />
      </mesh>
      {/* threshold */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[d.w, WALL_T + 0.02]} />
        <meshStandardMaterial color="#d8d2c6" roughness={0.4} />
      </mesh>
      {/* door leaf, standing open against the wall */}
      <group position={[-d.w / 2 + 0.02, 0, swing * (WALL_T / 2)]} rotation={[0, -swing * 1.75, 0]}>
        <mesh position={[leafW / 2, d.h / 2 - 0.01, 0]} castShadow receiveShadow>
          <boxGeometry args={[leafW, d.h - 0.02, 0.04]} />
          <Wood color={d.type === 'entrance' ? '#5a3a24' : '#c49a6c'} />
        </mesh>
        <mesh position={[leafW - 0.08, 1.0, 0.03 * swing]} castShadow>
          <boxGeometry args={[0.12, 0.02, 0.02]} />
          <meshStandardMaterial color="#c8a45c" metalness={1} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
