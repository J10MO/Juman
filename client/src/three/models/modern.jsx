// Contemporary furniture. Same conventions as the rest: stands on y = 0,
// centred on x/z, front faces +z, sizes come from the product's dims.
import { useMemo } from 'react'
import * as THREE from 'three'
import { Box, Brass, Cyl, Fabric, Lacquer, Lathe, Metal, RBox, Wood } from './materials.jsx'
import { boucleBump, marbleTexture, rng, travertineTexture } from '../textures.js'

const BLACK = '#1b1b1d'
const OAK = '#c9a377'
const CREAM = '#efe9de'

export function Boucle({ color }) {
  const bump = boucleBump()
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.95}
      bumpMap={bump}
      bumpScale={1.2}
      sheen={0.8}
      sheenRoughness={0.9}
      sheenColor="#ffffff"
    />
  )
}

export function Marble({ kind = 'carrara' }) {
  const map = marbleTexture(kind)
  return <meshPhysicalMaterial map={map} roughness={0.18} clearcoat={0.7} clearcoatRoughness={0.12} />
}

export function Travertine() {
  const map = travertineTexture()
  return <meshStandardMaterial map={map} roughness={0.7} bumpMap={map} bumpScale={0.4} />
}

/** Material for "stone" products: the colour picks the stone. */
function Stone({ color }) {
  if (color === '#d9c7aa') return <Travertine />
  const kind = { '#1d1d1f': 'nero', '#2f4a3e': 'verde', '#e9d6cc': 'rosa' }[color] || 'carrara'
  return <Marble kind={kind} />
}

function Matte({ color, roughness = 0.6 }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0.2} />
}

/** Thin metal legs, slightly inset. */
function PinLegs({ w, d, h, inset = 0.08, r = 0.012, color = BLACK }) {
  return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
    <Cyl key={i} args={[r, r * 0.8, h, 12]} position={[sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset)]}>
      <Metal color={color} roughness={0.35} />
    </Cyl>
  ))
}

// ---------------------------------------------------------------- living

/** Low, deep sofa with chunky cushions on a recessed plinth. */
export function ModernSofa({ color, dims }) {
  const { w, d, h } = dims
  const plinth = 0.07
  const base = 0.24
  const arm = 0.24
  const backD = 0.24
  const seatW = w - arm * 2
  const seats = w > 2 ? 2 : 1
  const cw = seatW / seats
  return (
    <group>
      <Box args={[w - 0.12, plinth, d - 0.12]} position={[0, plinth / 2, 0]}>
        <Matte color={BLACK} />
      </Box>
      <RBox args={[w, base, d]} radius={0.05} position={[0, plinth + base / 2, 0]}>
        <Boucle color={color} />
      </RBox>
      {[-1, 1].map((s) => (
        <RBox key={s} args={[arm, h * 0.62 - plinth, d]} radius={0.1} smoothness={6} position={[s * (w / 2 - arm / 2), plinth + (h * 0.62 - plinth) / 2, 0]}>
          <Boucle color={color} />
        </RBox>
      ))}
      <RBox args={[w, h - plinth - 0.05, backD]} radius={0.1} smoothness={6} position={[0, plinth + (h - plinth - 0.05) / 2, -d / 2 + backD / 2]}>
        <Boucle color={color} />
      </RBox>
      {Array.from({ length: seats }, (_, i) => {
        const x = -seatW / 2 + cw * (i + 0.5)
        return (
          <group key={i}>
            <RBox args={[cw - 0.01, 0.17, d - backD - 0.02]} radius={0.08} smoothness={6} position={[x, plinth + base + 0.085, backD / 2]}>
              <Boucle color={color} />
            </RBox>
            <RBox args={[cw - 0.03, 0.46, 0.2]} radius={0.12} smoothness={6} position={[x, plinth + base + 0.17 + 0.2, -d / 2 + backD + 0.08]} rotation={[-0.16, 0, 0]}>
              <Boucle color={color} />
            </RBox>
          </group>
        )
      })}
      {/* bolster + throw pillow */}
      <mesh position={[-seatW / 2 + 0.2, plinth + base + 0.26, -d / 2 + backD + 0.26]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.1, 0.32, 8, 20]} />
        <Fabric color="#c8a45c" />
      </mesh>
      <RBox args={[0.44, 0.44, 0.14]} radius={0.07} smoothness={6} position={[seatW / 2 - 0.32, plinth + base + 0.38, -d / 2 + backD + 0.2]} rotation={[-0.25, -0.3, 0.06]}>
        <Fabric color="#3e5c6e" />
      </RBox>
    </group>
  )
}

/** L-shaped sectional: main sofa along the back, chaise on the left. */
export function Sectional({ color, dims }) {
  const { w, d, h } = dims
  const seatD = 1.0
  const chaiseW = 0.95
  const plinth = 0.07
  const base = 0.24
  const back = 0.22
  return (
    <group>
      <Box args={[w - 0.1, plinth, seatD - 0.1]} position={[0, plinth / 2, -d / 2 + seatD / 2]}>
        <Matte color={BLACK} />
      </Box>
      <Box args={[chaiseW - 0.1, plinth, d - seatD]} position={[-w / 2 + chaiseW / 2, plinth / 2, -d / 2 + seatD + (d - seatD) / 2]}>
        <Matte color={BLACK} />
      </Box>
      {/* bases */}
      <RBox args={[w, base, seatD]} radius={0.05} position={[0, plinth + base / 2, -d / 2 + seatD / 2]}>
        <Boucle color={color} />
      </RBox>
      <RBox args={[chaiseW, base, d - seatD + 0.02]} radius={0.05} position={[-w / 2 + chaiseW / 2, plinth + base / 2, -d / 2 + seatD + (d - seatD) / 2]}>
        <Boucle color={color} />
      </RBox>
      {/* back and right arm */}
      <RBox args={[w, h - plinth - 0.05, back]} radius={0.1} smoothness={6} position={[0, plinth + (h - plinth - 0.05) / 2, -d / 2 + back / 2]}>
        <Boucle color={color} />
      </RBox>
      <RBox args={[0.22, h * 0.6 - plinth, seatD]} radius={0.1} smoothness={6} position={[w / 2 - 0.11, plinth + (h * 0.6 - plinth) / 2, -d / 2 + seatD / 2]}>
        <Boucle color={color} />
      </RBox>
      {/* cushions */}
      {[0, 1, 2].map((i) => {
        const cw = (w - 0.22) / 3
        const x = -w / 2 + cw * (i + 0.5)
        return (
          <group key={i}>
            <RBox args={[cw - 0.015, 0.16, seatD - back - 0.02]} radius={0.08} smoothness={6} position={[x, plinth + base + 0.08, -d / 2 + back + (seatD - back) / 2]}>
              <Boucle color={color} />
            </RBox>
            <RBox args={[cw - 0.04, 0.44, 0.2]} radius={0.12} smoothness={6} position={[x, plinth + base + 0.36, -d / 2 + back + 0.08]} rotation={[-0.15, 0, 0]}>
              <Boucle color={color} />
            </RBox>
          </group>
        )
      })}
      <RBox args={[chaiseW - 0.02, 0.16, d - seatD - 0.02]} radius={0.08} smoothness={6} position={[-w / 2 + chaiseW / 2, plinth + base + 0.08, -d / 2 + seatD + (d - seatD) / 2]}>
        <Boucle color={color} />
      </RBox>
      <RBox args={[0.42, 0.42, 0.14]} radius={0.07} smoothness={6} position={[w / 2 - 0.45, plinth + base + 0.36, -d / 2 + back + 0.2]} rotation={[-0.25, 0.3, -0.05]}>
        <Fabric color="#c8a45c" />
      </RBox>
    </group>
  )
}

/** Rounded bouclé barrel chair. */
export function CurveChair({ color, dims }) {
  const { w, h } = dims
  const r = w / 2
  const shell = useMemo(() => {
    // a thick open ring (240°) extruded upward, rounded by a lathe-like profile
    const shape = new THREE.Shape()
    const a0 = Math.PI * 0.2
    const a1 = Math.PI * 1.8
    shape.absarc(0, 0, r, a0, a1, false)
    shape.absarc(0, 0, r - 0.13, a1, a0, true)
    const g = new THREE.ExtrudeGeometry(shape, { depth: h - 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 8, curveSegments: 48 })
    g.rotateX(-Math.PI / 2)
    g.rotateY(-Math.PI / 2) // opening faces the front (+z)
    return g
  }, [r, h])
  return (
    <group>
      <Cyl args={[r - 0.04, r - 0.02, 0.06, 40]} position={[0, 0.03, 0]}>
        <Matte color={BLACK} />
      </Cyl>
      <mesh geometry={shell} position={[0, 0.07, 0]} castShadow receiveShadow>
        <Boucle color={color} />
      </mesh>
      {/* low seat base and a plump cushion */}
      <mesh position={[0, 0.07 + 0.11, 0.02]} castShadow receiveShadow>
        <cylinderGeometry args={[r - 0.1, r - 0.1, 0.22, 48]} />
        <Boucle color={color} />
      </mesh>
      <mesh position={[0, 0.07 + 0.24, 0.04]} scale={[1, 0.22, 1]} castShadow>
        <sphereGeometry args={[r - 0.11, 40, 20]} />
        <Boucle color={color} />
      </mesh>
    </group>
  )
}

export function BouclePouf({ color, dims }) {
  const r = dims.w / 2
  const h = dims.h
  return (
    <group>
      <mesh position={[0, h / 2, 0]} scale={[1, h / (2 * r) + 0.05, 1]} castShadow receiveShadow>
        <sphereGeometry args={[r, 48, 32]} />
        <Boucle color={color} />
      </mesh>
    </group>
  )
}

/** Two round stone tables, one tucked under the other. */
export function NestingTables({ color, dims }) {
  const { w, d, h } = dims
  const big = Math.min(d, w * 0.62) / 2
  const small = big * 0.72
  const bx = w / 2 - big
  const sx = -w / 2 + small
  return (
    <group>
      {[[bx, 0, big, h], [sx, d / 2 - small, small, h * 0.78]].map(([x, z, r, th], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cyl args={[r, r, 0.03, 56]} position={[0, th - 0.015, 0]}>
            <Stone color={color} />
          </Cyl>
          <Cyl args={[r * 0.35, r * 0.45, th - 0.03, 40]} position={[0, (th - 0.03) / 2, 0]}>
            <Stone color={color} />
          </Cyl>
        </group>
      ))}
    </group>
  )
}

/** Rounded slab coffee table on two drum pedestals. */
export function MarbleCoffee({ color, dims }) {
  const { w, d, h } = dims
  return (
    <group>
      <RBox args={[w, 0.05, d]} radius={0.02} position={[0, h - 0.025, 0]}>
        <Stone color={color} />
      </RBox>
      {[-1, 1].map((s) => (
        <Cyl key={s} args={[d * 0.3, d * 0.3, h - 0.05, 40]} position={[s * w * 0.28, (h - 0.05) / 2, 0]}>
          <Stone color={color} />
        </Cyl>
      ))}
    </group>
  )
}

/** Arc floor lamp: marble block, steel arc, dome shade. Glows at night. */
export function ArcLamp({ color, dims, lit }) {
  const { h } = dims
  const reach = 1.5
  const tube = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.25, 0),
      new THREE.Vector3(0, h + 0.15, 0),
      new THREE.Vector3(0, h + 0.15, reach * 0.8),
      new THREE.Vector3(0, h - 0.35, reach),
    )
    return new THREE.TubeGeometry(curve, 64, 0.014, 10, false)
  }, [h])
  return (
    <group>
      <RBox args={[0.32, 0.25, 0.32]} radius={0.015} position={[0, 0.125, 0]}>
        <Marble kind="nero" />
      </RBox>
      <mesh geometry={tube} castShadow>
        <meshStandardMaterial color="#c9ccd1" metalness={0.95} roughness={0.18} />
      </mesh>
      <group position={[0, h - 0.4, reach]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#fff6e5" emissive="#ffd9a0" emissiveIntensity={lit ? 5 : 0.05} />
        </mesh>
        {lit && <pointLight color="#ffd9a0" intensity={2.4} distance={6} decay={2} position={[0, -0.1, 0]} />}
      </group>
    </group>
  )
}

/** Fluted wood slats (vertical half-round battens). */
function Fluted({ w, h, color, z = 0, step = 0.035 }) {
  const n = Math.floor(w / step)
  return Array.from({ length: n }, (_, i) => (
    <Cyl key={i} args={[step * 0.48, step * 0.48, h, 10]} position={[-w / 2 + step * (i + 0.5), 0, z]}>
      <Wood color={color} />
    </Cyl>
  ))
}

/** Media wall: fluted panel, floating cabinet, TV and an LED glow. */
export function TvWall({ color, dims, lit }) {
  const { w, d, h } = dims
  const cabH = 0.36
  const cabY = 0.22
  const tvW = Math.min(1.65, w * 0.7)
  const tvH = tvW * 0.5625
  return (
    <group>
      <group position={[0, h / 2, -d / 2 + 0.03]}>
        <Box args={[w, h, 0.02]}>
          <Wood color={color} />
        </Box>
        <group position={[0, 0, 0.012]}>
          <Fluted w={w} h={h} color={color} />
        </group>
      </group>
      <RBox args={[w * 0.92, cabH, d - 0.06]} radius={0.01} position={[0, cabY + cabH / 2, 0.02]}>
        <Lacquer color="#2b2622" />
      </RBox>
      <Box args={[w * 0.92 - 0.02, 0.005, d - 0.07]} position={[0, cabY + cabH + 0.003, 0.02]}>
        <Travertine />
      </Box>
      {/* LED strip under the cabinet */}
      <Box args={[w * 0.9, 0.01, 0.02]} position={[0, cabY - 0.01, 0]} castShadow={false}>
        <meshStandardMaterial color="#fff2d6" emissive="#ffcf8a" emissiveIntensity={lit ? 3 : 0.4} />
      </Box>
      {lit && <pointLight color="#ffcf8a" intensity={0.8} distance={2.5} decay={2} position={[0, cabY - 0.08, 0.1]} />}
      <group position={[0, cabY + cabH + 0.32 + tvH / 2, -d / 2 + 0.07]}>
        <Box args={[tvW, tvH, 0.03]}>
          <meshStandardMaterial color="#0f0f10" roughness={0.5} metalness={0.4} />
        </Box>
        <mesh position={[0, 0, 0.016]}>
          <planeGeometry args={[tvW - 0.02, tvH - 0.02]} />
          <meshPhysicalMaterial
            color={lit ? '#22364a' : '#050608'}
            emissive={lit ? '#2a4a6b' : '#000000'}
            emissiveIntensity={lit ? 0.8 : 0}
            roughness={0.06}
            clearcoat={1}
          />
        </mesh>
      </group>
    </group>
  )
}

/** Sideboard with fluted doors on slim legs. */
export function Sideboard({ color, dims }) {
  const { w, d, h } = dims
  const legH = 0.16
  const bodyH = h - legH
  return (
    <group>
      <PinLegs w={w} d={d} h={legH} inset={0.1} r={0.014} />
      <RBox args={[w, bodyH, d]} radius={0.012} position={[0, legH + bodyH / 2, 0]}>
        <Wood color={color} />
      </RBox>
      <group position={[0, legH + bodyH / 2, d / 2 + 0.005]}>
        <Fluted w={w - 0.04} h={bodyH - 0.06} color={color} />
      </group>
      <Box args={[w + 0.01, 0.02, d + 0.01]} position={[0, h - 0.01, 0]}>
        <Travertine />
      </Box>
      {[-1, 1].map((s) => (
        <Box key={s} args={[0.012, 0.16, 0.02]} position={[s * 0.03, legH + bodyH / 2, d / 2 + 0.03]}>
          <Brass />
        </Box>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- bedroom

/** Low platform bed with a channel-tufted headboard. */
export function PlatformBed({ color, dims }) {
  const { w, d, h } = dims
  const base = 0.28
  const headT = 0.12
  const mattressTop = base + 0.22
  const channels = Math.round(w / 0.16)
  return (
    <group>
      <Box args={[w - 0.16, 0.06, d - 0.2]} position={[0, 0.03, 0]}>
        <Matte color={BLACK} />
      </Box>
      <RBox args={[w, base - 0.06, d - headT]} radius={0.04} position={[0, 0.06 + (base - 0.06) / 2, headT / 2]}>
        <Fabric color={color} />
      </RBox>
      {/* headboard: vertical channels */}
      {Array.from({ length: channels }, (_, i) => (
        <RBox
          key={i}
          args={[w / channels - 0.006, h - 0.05, headT]}
          radius={0.05}
          smoothness={5}
          position={[-w / 2 + (w / channels) * (i + 0.5), 0.05 + (h - 0.05) / 2, -d / 2 + headT / 2]}
        >
          <Fabric color={color} />
        </RBox>
      ))}
      <RBox args={[w - 0.08, 0.22, d - headT - 0.08]} radius={0.06} smoothness={5} position={[0, base + 0.11, headT / 2]}>
        <Fabric color="#f8f5ef" />
      </RBox>
      {/* linen duvet folded back, and a knitted throw */}
      <RBox args={[w - 0.02, 0.08, d * 0.6]} radius={0.04} smoothness={5} position={[0, mattressTop + 0.03, d / 2 - d * 0.3 - 0.02]}>
        <Fabric color="#ece5da" />
      </RBox>
      <RBox args={[w - 0.01, 0.09, 0.26]} radius={0.045} smoothness={5} position={[0, mattressTop + 0.07, d / 2 - d * 0.6 + 0.1]}>
        <Fabric color="#ece5da" />
      </RBox>
      <RBox args={[w + 0.02, 0.05, 0.45]} radius={0.025} position={[0, mattressTop + 0.08, d / 2 - 0.35]}>
        <Fabric color="#b5643c" />
      </RBox>
      {[-1, 1].map((s) => (
        <group key={s}>
          <RBox args={[w / 2 - 0.14, 0.16, 0.42]} radius={0.08} smoothness={6} position={[s * (w / 4 - 0.02), mattressTop + 0.1, -d / 2 + headT + 0.28]} rotation={[-0.4, 0, 0]}>
            <Fabric color="#fbf8f2" />
          </RBox>
          <RBox args={[0.4, 0.3, 0.12]} radius={0.06} smoothness={6} position={[s * 0.24, mattressTop + 0.18, -d / 2 + headT + 0.5]} rotation={[-0.3, s * 0.2, 0]}>
            <Fabric color={s > 0 ? '#c8a45c' : '#3e5c6e'} />
          </RBox>
        </group>
      ))}
    </group>
  )
}

/** Nightstand with a rounded drawer on slim legs. */
export function ModernNightstand({ color, dims }) {
  const { w, d, h } = dims
  const legH = 0.2
  const bodyH = h - legH
  return (
    <group>
      <PinLegs w={w} d={d} h={legH} inset={0.05} r={0.01} color="#c8a45c" />
      <RBox args={[w, bodyH, d]} radius={0.04} smoothness={5} position={[0, legH + bodyH / 2, 0]}>
        <Wood color={color} gloss={0.5} />
      </RBox>
      <Box args={[w - 0.06, 0.004, 0.004]} position={[0, legH + bodyH / 2, d / 2 + 0.001]}>
        <meshStandardMaterial color="#2b2622" />
      </Box>
      <Cyl args={[0.012, 0.012, 0.04, 16]} position={[0, legH + bodyH * 0.72, d / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <Brass />
      </Cyl>
    </group>
  )
}

/** Wardrobe with two sliding doors: wood and bronze mirror. */
export function SlidingWardrobe({ color, dims }) {
  const { w, d, h } = dims
  return (
    <group>
      <Box args={[w, 0.06, d - 0.04]} position={[0, 0.03, -0.02]}>
        <Matte color={BLACK} />
      </Box>
      <Box args={[w, h - 0.06, d - 0.06]} position={[0, 0.06 + (h - 0.06) / 2, -0.03]}>
        <Wood color={color} />
      </Box>
      <Box args={[w / 2 + 0.02, h - 0.1, 0.025]} position={[-w / 4, 0.06 + (h - 0.06) / 2, d / 2 - 0.04]}>
        <Wood color={color} />
      </Box>
      <group position={[w / 4, 0.06 + (h - 0.06) / 2, d / 2 - 0.01]}>
        <Box args={[w / 2 + 0.02, h - 0.1, 0.02]}>
          <meshStandardMaterial color="#2b2b2b" metalness={0.8} roughness={0.3} />
        </Box>
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[w / 2 - 0.02, h - 0.14]} />
          <meshStandardMaterial color="#d9c9b0" metalness={1} roughness={0.05} />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <Box key={s} args={[0.015, 0.5, 0.025]} position={[s * 0.05, h * 0.5, d / 2 + 0.01 - (s < 0 ? 0.03 : 0)]}>
          <Metal color={BLACK} />
        </Box>
      ))}
    </group>
  )
}

/** Arched floor mirror leaning on the wall. */
export function FloorMirror({ color, dims }) {
  const { w, h } = dims
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const r = w / 2
    s.moveTo(-r, 0)
    s.lineTo(r, 0)
    s.lineTo(r, h - r)
    s.absarc(0, h - r, r, 0, Math.PI, false)
    s.lineTo(-r, 0)
    return s
  }, [w, h])
  const frame = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false, curveSegments: 40 }), [shape])
  const glass = useMemo(() => {
    const inner = new THREE.Shape()
    const r = w / 2 - 0.03
    inner.moveTo(-r, 0.03)
    inner.lineTo(r, 0.03)
    inner.lineTo(r, h - w / 2)
    inner.absarc(0, h - w / 2, r, 0, Math.PI, false)
    inner.lineTo(-r, 0.03)
    return new THREE.ShapeGeometry(inner, 40)
  }, [w, h])
  return (
    <group rotation={[-0.08, 0, 0]} position={[0, 0, 0.04]}>
      <mesh geometry={frame} castShadow>
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh geometry={glass} position={[0, 0, 0.031]}>
        <meshStandardMaterial color="#e4ebee" metalness={1} roughness={0.03} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------- dining & kitchen

/** Oval stone dining table on two sculpted pedestals. */
export function MarbleDining({ color, dims }) {
  const { w, d, h } = dims
  const top = useMemo(() => {
    const s = new THREE.Shape()
    const r = d / 2
    s.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false)
    s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, curveSegments: 40 })
    g.rotateX(-Math.PI / 2)
    // remap UVs so the slab texture spans the whole top
    const uv = g.attributes.uv
    const pos = g.attributes.position
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getZ(i) + d / 2) / d)
    return g
  }, [w, d])
  return (
    <group>
      <mesh geometry={top} position={[0, h - 0.04, 0]} castShadow receiveShadow>
        <Stone color={color} />
      </mesh>
      {[-1, 1].map((s) => (
        <Lathe
          key={s}
          position={[s * w * 0.27, 0, 0]}
          points={[[0, 0], [0.24, 0], [0.24, 0.03], [0.12, 0.12], [0.09, h * 0.5], [0.13, h - 0.08], [0.16, h - 0.05], [0, h - 0.05]]}
        >
          <Stone color={color} />
        </Lathe>
      ))}
    </group>
  )
}

/** Moulded shell chair on oak dowel legs, with a seat pad. */
export function ShellChair({ color, dims }) {
  const { w, d, h } = dims
  const seatH = 0.46
  const shell = useMemo(() => {
    // a curved shell: a partial sphere band, flattened
    const g = new THREE.SphereGeometry(w / 2, 40, 16, Math.PI * 0.15, Math.PI * 1.7, Math.PI * 0.32, Math.PI * 0.38)
    g.rotateY(Math.PI / 2)
    g.scale(1, 1.25, 1)
    return g
  }, [w])
  return (
    <group>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <Cyl key={i} args={[0.016, 0.012, seatH, 12]} position={[sx * (w / 2 - 0.07), seatH / 2, sz * (d / 2 - 0.08)]} rotation={[sz * 0.08, 0, -sx * 0.08]}>
          <Wood color={OAK} />
        </Cyl>
      ))}
      <mesh geometry={shell} position={[0, seatH + 0.02, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, seatH, 0.02]} scale={[1, 0.12, 1]} castShadow>
        <cylinderGeometry args={[w / 2 - 0.04, w / 2 - 0.05, 0.4, 36]} />
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, seatH + 0.035, 0.03]} scale={[1, 0.18, 1]} castShadow>
        <sphereGeometry args={[w / 2 - 0.08, 32, 12]} />
        <Fabric color={CREAM} />
      </mesh>
      <mesh visible={false}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
    </group>
  )
}

/** Waterfall marble kitchen island. */
export function KitchenIsland({ color, dims }) {
  const { w, d, h } = dims
  const t = 0.05
  return (
    <group>
      <Box args={[w, t, d]} position={[0, h - t / 2, 0]}>
        <Stone color={color} />
      </Box>
      {[-1, 1].map((s) => (
        <Box key={s} args={[t, h - t, d]} position={[s * (w / 2 - t / 2), (h - t) / 2, 0]}>
          <Stone color={color} />
        </Box>
      ))}
      <Box args={[w - t * 2, h - t - 0.08, d - 0.25]} position={[0, 0.08 + (h - t - 0.08) / 2, -0.1]}>
        <Lacquer color="#2b2622" />
      </Box>
      <group position={[0, 0.08 + (h - t - 0.08) / 2, d / 2 - 0.23]}>
        <Fluted w={w - t * 2 - 0.02} h={h - t - 0.1} color={OAK} />
      </group>
    </group>
  )
}

export function ModernStool({ color, dims }) {
  const { h } = dims
  const r = dims.w / 2
  return (
    <group>
      <mesh position={[0, h - 0.04, 0]} scale={[1, 0.3, 1]} castShadow>
        <sphereGeometry args={[r, 32, 16]} />
        <Boucle color={color} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <Cyl key={i} args={[0.012, 0.012, h - 0.05, 10]} position={[Math.cos(a) * r * 0.62, (h - 0.05) / 2, Math.sin(a) * r * 0.62]} rotation={[Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12]}>
            <Metal color={BLACK} />
          </Cyl>
        )
      })}
      <mesh position={[0, h * 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[r * 0.68, 0.01, 8, 32]} />
        <Metal color={BLACK} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------- office

export function ModernDesk({ color, dims }) {
  const { w, d, h } = dims
  return (
    <group>
      <RBox args={[w, 0.03, d]} radius={0.01} position={[0, h - 0.015, 0]}>
        <Wood color={color} gloss={0.4} />
      </RBox>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 0.06), 0, 0]}>
          {/* sled leg: a closed metal loop */}
          <Box args={[0.03, h - 0.03, 0.03]} position={[0, (h - 0.03) / 2, -d / 2 + 0.06]}>
            <Metal color={BLACK} />
          </Box>
          <Box args={[0.03, h - 0.03, 0.03]} position={[0, (h - 0.03) / 2, d / 2 - 0.06]}>
            <Metal color={BLACK} />
          </Box>
          <Box args={[0.03, 0.03, d - 0.1]} position={[0, 0.015, 0]}>
            <Metal color={BLACK} />
          </Box>
        </group>
      ))}
      {/* cable tray and a small drawer */}
      <Box args={[w * 0.6, 0.08, 0.15]} position={[0, h - 0.08, -d / 2 + 0.12]}>
        <Metal color={BLACK} />
      </Box>
      <RBox args={[0.45, 0.09, d - 0.12]} radius={0.01} position={[w / 2 - 0.32, h - 0.075, 0]}>
        <Wood color={color} />
      </RBox>
    </group>
  )
}

/** Ergonomic mesh office chair on a five-star base. */
export function OfficeChair({ color, dims }) {
  const { h } = dims
  const seatH = 0.48
  return (
    <group>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Box args={[0.3, 0.03, 0.05]} position={[0.15, 0.08, 0]}>
              <Metal color={BLACK} />
            </Box>
            <mesh position={[0.3, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.025, 16]} />
              <Matte color="#111" />
            </mesh>
          </group>
        )
      })}
      <Cyl args={[0.025, 0.03, seatH - 0.12, 16]} position={[0, 0.08 + (seatH - 0.12) / 2, 0]}>
        <meshStandardMaterial color="#c9ccd1" metalness={0.95} roughness={0.2} />
      </Cyl>
      <RBox args={[0.5, 0.08, 0.48]} radius={0.04} position={[0, seatH, 0.02]}>
        <Fabric color={color} />
      </RBox>
      {/* mesh back */}
      <group position={[0, seatH + 0.05, -0.22]}>
        <Box args={[0.04, 0.5, 0.03]} position={[0, 0.25, -0.02]}>
          <Matte color="#111" />
        </Box>
        <RBox args={[0.46, h - seatH - 0.12, 0.04]} radius={0.02} position={[0, 0.06 + (h - seatH - 0.12) / 2, 0.02]} rotation={[-0.12, 0, 0]}>
          <meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.9} />
        </RBox>
      </group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.27, seatH, 0]}>
          <Box args={[0.03, 0.2, 0.03]} position={[0, 0.1, -0.05]}>
            <Matte color="#111" />
          </Box>
          <RBox args={[0.06, 0.03, 0.26]} radius={0.012} position={[0, 0.21, 0]}>
            <Matte color="#111" />
          </RBox>
        </group>
      ))}
    </group>
  )
}

/** Open shelving: black steel frame, oak boards, books and objects. */
export function ModernShelf({ color, dims }) {
  const { w, d, h } = dims
  const levels = 5
  const gap = (h - 0.05) / levels
  const things = useMemo(() => {
    const rand = rng(7)
    const palette = ['#e8dfcf', '#2e4a62', '#c8a45c', '#b5643c', '#38463a', '#d8c8b0']
    const list = []
    for (let lv = 0; lv < levels; lv++) {
      const y = 0.05 + lv * gap + 0.02
      let x = -w / 2 + 0.06
      while (x < w / 2 - 0.12) {
        const r = rand()
        if (r < 0.55) {
          // a stack of books
          const n = 3 + Math.floor(rand() * 6)
          for (let k = 0; k < n && x < w / 2 - 0.08; k++) {
            const bw = 0.025 + rand() * 0.02
            const bh = Math.min(gap - 0.06, 0.18 + rand() * 0.1)
            list.push({ t: 'book', x: x + bw / 2, y: y + bh / 2, w: bw, h: bh, c: palette[Math.floor(rand() * palette.length)] })
            x += bw + 0.002
          }
          x += 0.08
        } else if (r < 0.8) {
          const vh = 0.12 + rand() * 0.1
          list.push({ t: 'vase', x: x + 0.06, y, h: vh, c: palette[Math.floor(rand() * palette.length)] })
          x += 0.2
        } else {
          x += 0.18
        }
      }
    }
    return list
  }, [w, gap])
  return (
    <group>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <Box key={i} args={[0.02, h, 0.02]} position={[sx * (w / 2 - 0.01), h / 2, sz * (d / 2 - 0.01)]}>
          <Metal color={BLACK} />
        </Box>
      ))}
      {Array.from({ length: levels + 1 }, (_, i) => (
        <Box key={i} args={[w, 0.025, d]} position={[0, 0.04 + i * gap, 0]}>
          <Wood color={color} />
        </Box>
      ))}
      {things.map((t, i) =>
        t.t === 'book' ? (
          <Box key={i} args={[t.w, t.h, d * 0.7]} position={[t.x, t.y, 0]}>
            <Lacquer color={t.c} />
          </Box>
        ) : (
          <Lathe key={i} position={[t.x, t.y, 0]} points={[[0, 0], [0.045, 0], [0.055, t.h * 0.4], [0.03, t.h * 0.85], [0.032, t.h], [0, t.h]]}>
            <meshPhysicalMaterial color={t.c} roughness={0.3} clearcoat={0.6} />
          </Lathe>
        ),
      )}
    </group>
  )
}

