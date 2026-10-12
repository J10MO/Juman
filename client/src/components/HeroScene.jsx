import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { FurnitureModel } from '../three/models/index.jsx'
import { StudioEnvironment } from '../three/Lighting.jsx'
import { floorTexture } from '../three/textures.js'

// A small living-room vignette. Products are defined locally so the hero
// renders instantly, even before the API answers.
const P = (modelKey, dims, kind = 'floor') => ({ id: modelKey, modelKey, dims, kind, colors: [] })
const PIECES = [
  { p: P('rug', { w: 2.4, d: 1.7, h: 0.012 }, 'rug'), color: '#8e2f2a', pos: [0, 0, 0.1], rot: 0 },
  { p: P('sofa', { w: 2.2, d: 0.95, h: 0.85 }), color: '#3e5c6e', pos: [0, 0, -0.95], rot: 0 },
  { p: P('coffee-table', { w: 1.1, d: 0.6, h: 0.42 }), color: '#8a5a3b', pos: [0, 0, 0.25], rot: 0 },
  { p: P('armchair', { w: 0.85, d: 0.85, h: 0.92 }), color: '#b0794a', pos: [1.55, 0, 0.35], rot: -Math.PI / 2.4 },
  { p: P('olive-tree', { w: 0.5, d: 0.5, h: 1.45 }), color: '#b5643c', pos: [-1.55, 0, -1.05], rot: 0 },
  { p: P('floor-lamp', { w: 0.42, d: 0.42, h: 1.65 }), color: '#f1e6d0', pos: [1.45, 0, -1.0], rot: 0 },
  { p: P('vase', { w: 0.2, d: 0.2, h: 0.48 }, 'small'), color: '#b5643c', pos: [0.25, 0.42, 0.25], rot: 0 },
  { p: P('ottoman', { w: 0.55, d: 0.55, h: 0.42 }), color: '#c8a45c', pos: [-1.2, 0, 0.75], rot: 0 },
]

function Piece({ piece, delay }) {
  const ref = useRef()
  const st = useRef({ t: -delay, y: 2.2, vy: 0, squash: 0, done: false })
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    const s = st.current
    const g = ref.current
    s.t += dt
    if (s.t < 0) {
      g.visible = false
      return
    }
    g.visible = true
    if (!s.done) {
      s.vy -= 9.81 * dt
      s.y += s.vy * dt
      if (s.y <= 0) {
        s.y = 0
        if (-s.vy > 0.6 && piece.p.kind !== 'rug') {
          s.squash = Math.min(0.08, -s.vy * 0.02)
          s.vy = -s.vy * 0.3
        } else {
          s.vy = 0
          s.done = true
        }
      }
    }
    s.squash = THREE.MathUtils.damp(s.squash, 0, 8, dt)
    const sq = s.squash * Math.cos(s.t * 30)
    g.position.set(piece.pos[0], piece.pos[1] + s.y, piece.pos[2])
    g.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5)
  })
  return (
    <group ref={ref} rotation={[0, piece.rot, 0]} visible={false}>
      <FurnitureModel product={piece.p} color={piece.color} />
    </group>
  )
}

function Floor() {
  const map = useMemo(() => {
    const t = floorTexture('oak').clone()
    t.repeat.set(2, 2)
    t.needsUpdate = true
    return t
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[3.6, 96]} />
      <meshPhysicalMaterial map={map} roughness={0.5} clearcoat={0.3} />
    </mesh>
  )
}

/** Gently follows the mouse so the scene feels alive. */
function Parallax() {
  useFrame(({ camera, pointer }, dt) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, 4.2 + pointer.x * 0.6, 2, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 3.1 + pointer.y * 0.35, 2, dt)
    camera.lookAt(0, 0.45, -0.1)
  })
  return null
}

export default function HeroScene() {
  return (
    <Canvas shadows="soft" dpr={[1, 2]} camera={{ position: [4.2, 3.1, 4.6], fov: 34 }}>
      <Suspense fallback={null}>
        <StudioEnvironment />
      </Suspense>
      <hemisphereLight args={['#fff8ee', '#b49a7a', 0.35]} />
      <directionalLight
        position={[-3, 6, 3]}
        intensity={2.4}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={8}
      >
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.5, 20]} />
      </directionalLight>
      <Floor />
      {PIECES.map((piece, i) => (
        <Piece key={i} piece={piece} delay={0.3 + i * 0.28} />
      ))}
      <ContactShadows position={[0, 0.003, 0]} opacity={0.45} scale={8} blur={2.5} far={1.5} />
      <Parallax />
    </Canvas>
  )
}
