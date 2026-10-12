import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { FurnitureModel } from '../three/models/index.jsx'
import { StudioEnvironment } from '../three/Lighting.jsx'

/** Drops the model in from above with a little bounce when the product or colour changes. */
function DropIn({ children, dropKey }) {
  const ref = useRef()
  const st = useRef({ key: null, y: 0, vy: 0 })
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    const s = st.current
    if (s.key !== dropKey) {
      s.key = dropKey
      s.y = 0.5
      s.vy = 0
    }
    if (s.y > 0 || s.vy > 0) {
      s.vy -= 9.81 * dt
      s.y += s.vy * dt
      if (s.y <= 0) {
        s.y = 0
        s.vy = -s.vy > 0.5 ? -s.vy * 0.3 : 0
      }
    }
    ref.current.position.y = s.y
  })
  return <group ref={ref}>{children}</group>
}

export function ModelViewer({ product, color, lit = false, autoRotate = true }) {
  const { w, d, h } = product.dims
  const r = Math.sqrt(w * w + d * d + h * h) / 2
  const dist = Math.max(1.3, r * 3.2)
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: [dist * 0.7, h / 2 + dist * 0.45, dist * 0.75], fov: 34 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <Suspense fallback={null}>
        <StudioEnvironment night={lit} intensity={lit ? 2.5 : 1} />
      </Suspense>
      <ambientLight intensity={lit ? 0.05 : 0.2} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={lit ? 0.3 : 2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-3, 3, 3, -3, 0.5, 20]} />
      </directionalLight>
      <DropIn dropKey={product.id + color}>
        <FurnitureModel product={product} color={color} lit={lit} />
      </DropIn>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[Math.max(w, d) * 1.6, 64]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.6} scale={Math.max(w, d) * 3} blur={2.2} far={Math.max(1, h)} />
      <OrbitControls
        makeDefault
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
        enablePan={false}
        enableDamping
        minDistance={dist * 0.45}
        maxDistance={dist * 2}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, h * 0.45, 0]}
      />
    </Canvas>
  )
}
