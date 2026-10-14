import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { FurnitureModel } from '../three/models/index.jsx'
import { StudioEnvironment } from '../three/Lighting.jsx'
import { floorTexture } from '../three/textures.js'

// A styled modern living-room corner. Pieces are defined locally (scanned ones
// point straight at their GLB) so the hero renders without waiting for the API.
const built = (modelKey, dims, kind = 'floor') => ({ id: modelKey, modelKey, dims, kind, colors: [] })
const scan = (slug, dims, kind = 'floor') => ({ id: slug, modelKey: 'scan', modelUrl: `/models/${slug}.glb`, dims, kind, colors: ['natural'] })

const PIECES = [
  { p: built('rug:beni', { w: 2.7, d: 1.85, h: 0.025 }, 'rug'), color: '#2b2b2b', pos: [0, 0, 0.1], rot: 0 },
  { p: built('modern-sofa', { w: 2.4, d: 1.0, h: 0.76 }), color: '#eae4d8', pos: [0, 0, -1.2], rot: 0 },
  { p: built('marble-coffee', { w: 1.25, d: 0.65, h: 0.34 }), color: '#f1efeb', pos: [0, 0, 0.2], rot: 0 },
  { p: built('curve-chair', { w: 0.82, d: 0.82, h: 0.74 }), color: '#c9b49a', pos: [1.65, 0, 0.35], rot: -0.55 },
  { p: built('arc-lamp', { w: 0.32, d: 0.32, h: 2.05 }), color: '#c8a45c', pos: [-1.65, 0, -1.35], rot: 0.35 },
  { p: scan('oak-side-table', { w: 0.55, d: 0.45, h: 0.551 }), pos: [1.6, 0, -1.25], rot: 0 },
  { p: scan('clay-modern-vase', { w: 0.218, d: 0.218, h: 0.309 }, 'small'), pos: [1.6, 0.551, -1.25], rot: 0 },
  { p: scan('white-fluted-vase', { w: 0.204, d: 0.204, h: 0.4 }, 'small'), pos: [0.32, 0.34, 0.2], rot: 0 },
  { p: scan('terracotta-plant', { w: 0.587, d: 0.634, h: 1.35 }), pos: [-2.4, 0, -1.3], rot: 0.4 },
  { p: built('boucle-pouf', { w: 0.55, d: 0.55, h: 0.4 }), color: '#a9b5a0', pos: [-1.2, 0, 1.0], rot: 0 },
  { p: scan('heart-leaf-plant', { w: 0.701, d: 0.657, h: 0.841 }), pos: [-2.35, 0, 0.95], rot: 1.2 },
]

const BACK_Z = -1.85
const LEFT_X = -2.95
const WALL_H = 2.8
const WALL = '#e8dfd0'

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

/** Abstract canvas painting for the wall above the sofa. */
function useArtTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 640
    c.height = 440
    const g = c.getContext('2d')
    g.fillStyle = '#efe7da'
    g.fillRect(0, 0, 640, 440)
    const blobs = [
      ['#c9a377', 180, 250, 170],
      ['#a9b5a0', 420, 190, 150],
      ['#1f2a3a', 470, 330, 70],
      ['#b5643c', 250, 140, 60],
    ]
    for (const [col, x, y, r] of blobs) {
      g.fillStyle = col
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
    }
    g.strokeStyle = '#1f2a3a'
    g.lineWidth = 3
    g.beginPath()
    g.arc(320, 220, 190, Math.PI * 1.1, Math.PI * 1.9)
    g.stroke()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

/** Arched window: frame, mullions and a bright sky behind. */
function ArchedWindow({ x, w, h, sill }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-w / 2, 0)
    s.lineTo(w / 2, 0)
    s.lineTo(w / 2, h - w / 2)
    s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false)
    s.lineTo(-w / 2, 0)
    return s
  }, [w, h])
  const outline = useMemo(() => new THREE.BufferGeometry().setFromPoints(shape.getPoints(48)), [shape])
  return (
    <group position={[x, sill, BACK_Z + 0.012]}>
      <mesh>
        <shapeGeometry args={[shape, 48]} />
        <meshBasicMaterial color="#f7f3e9" toneMapped={false} />
      </mesh>
      <lineLoop geometry={outline} position={[0, 0, 0.004]}>
        <lineBasicMaterial color="#ffffff" />
      </lineLoop>
      <mesh position={[0, (h - w / 2) / 2, 0.01]}>
        <boxGeometry args={[0.035, h - w / 2, 0.02]} />
        <meshStandardMaterial color="#fbfaf7" />
      </mesh>
      <mesh position={[0, h * 0.42, 0.01]}>
        <boxGeometry args={[w, 0.035, 0.02]} />
        <meshStandardMaterial color="#fbfaf7" />
      </mesh>
      {/* sill */}
      <mesh position={[0, -0.02, 0.05]} castShadow>
        <boxGeometry args={[w + 0.14, 0.04, 0.1]} />
        <meshStandardMaterial color="#efe9de" roughness={0.4} />
      </mesh>
    </group>
  )
}

function Room() {
  const floor = useMemo(() => {
    const t = floorTexture('oak').clone()
    t.repeat.set(3, 3)
    t.needsUpdate = true
    return t
  }, [])
  const art = useArtTexture()
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshPhysicalMaterial map={floor} roughness={0.45} clearcoat={0.35} clearcoatRoughness={0.3} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, WALL_H / 2, BACK_Z]} receiveShadow>
        <planeGeometry args={[7, WALL_H]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      {/* left wall */}
      <mesh position={[LEFT_X, WALL_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[7, WALL_H]} />
        <meshStandardMaterial color="#e3d8c6" roughness={0.95} />
      </mesh>
      {/* skirting */}
      <mesh position={[0, 0.05, BACK_Z + 0.006]}>
        <boxGeometry args={[7, 0.1, 0.012]} />
        <meshStandardMaterial color="#f6f2ea" />
      </mesh>
      <mesh position={[LEFT_X + 0.006, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[7, 0.1, 0.012]} />
        <meshStandardMaterial color="#f6f2ea" />
      </mesh>
      <ArchedWindow x={1.95} w={0.95} h={2.05} sill={0.45} />
      {/* framed art above the sofa */}
      <group position={[0, 1.65, BACK_Z + 0.03]}>
        <mesh castShadow>
          <boxGeometry args={[1.12, 0.8, 0.04]} />
          <meshStandardMaterial color="#c8a45c" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.021]}>
          <planeGeometry args={[1.04, 0.72]} />
          <meshStandardMaterial map={art} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

/** Gently follows the mouse so the scene feels alive. */
function Parallax() {
  useFrame(({ camera, pointer }, dt) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, 3.9 + pointer.x * 0.5, 2, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 2.6 + pointer.y * 0.3, 2, dt)
    camera.lookAt(-0.1, 0.55, -0.35)
  })
  return null
}

export default function HeroScene() {
  return (
    <Canvas shadows="soft" dpr={[1, 2]} camera={{ position: [3.9, 2.6, 4.4], fov: 36 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#efe7da']} />
      <Suspense fallback={null}>
        <StudioEnvironment />
      </Suspense>
      <hemisphereLight args={['#fff6e8', '#b49a7a', 0.35]} />
      <directionalLight
        position={[3.5, 5.5, 3]}
        intensity={2.3}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={8}
      >
        <orthographicCamera attach="shadow-camera" args={[-4.5, 4.5, 4.5, -4.5, 0.5, 20]} />
      </directionalLight>
      <Room />
      {PIECES.map((piece, i) => (
        <Piece key={i} piece={piece} delay={0.25 + i * 0.22} />
      ))}
      <ContactShadows position={[0, 0.003, 0]} opacity={0.4} scale={9} blur={2.5} far={1.5} />
      <Parallax />
    </Canvas>
  )
}
