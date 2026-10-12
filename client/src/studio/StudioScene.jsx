import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { House } from '../three/House.jsx'
import { planBounds } from './plan.js'
import { RoomLights, StudioEnvironment } from '../three/Lighting.jsx'
import { Item } from './Item.jsx'
import { CameraRig, DragController } from './DragController.jsx'
import { drag, useStudio } from './store.js'
import { dragApi } from './dragApi.js'

function Items() {
  const items = useStudio((s) => s.items)
  const productMap = useStudio((s) => s.productMap)
  return items.map((it) => {
    const product = productMap[it.productId]
    return product ? <Item key={it.uid} item={it} product={product} /> : null
  })
}

function CaptureBridge() {
  const { gl } = useThree()
  useEffect(() => {
    dragApi.capture = (width = 640) => {
      const src = gl.domElement
      const height = Math.round((src.height / src.width) * width)
      const out = document.createElement('canvas')
      out.width = width
      out.height = height
      out.getContext('2d').drawImage(src, 0, 0, width, height)
      return out.toDataURL('image/jpeg', 0.82)
    }
    return () => (dragApi.capture = () => null)
  }, [gl])
  return null
}

function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO aoRadius={0.55} distanceFalloff={0.6} intensity={2.4} quality="medium" halfRes />
      <SMAA />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.35} darkness={0.4} />
    </EffectComposer>
  )
}

export default function StudioScene() {
  const plan = useStudio((s) => s.plan)
  const walls = useStudio((s) => s.walls)
  const activeRoom = useStudio((s) => s.activeRoom)
  const night = useStudio((s) => s.night)
  const bounds = planBounds(plan.rooms)
  const quality = useStudio((s) => s.quality)
  const select = useStudio((s) => s.select)
  const bg = night ? '#0b0e15' : '#efe9df'

  const deselect = (e, roomId) => {
    // ignore the click that ends an orbit or a drag
    if (e?.delta > 4) return
    if (drag.endedAt && performance.now() - drag.endedAt < 200) return
    select(null)
    if (roomId) useStudio.getState().setActiveRoom(roomId)
  }

  return (
    <Canvas
      className="studio-canvas"
      shadows="soft"
      dpr={[1, quality === 'high' ? 2 : 1.25]}
      gl={{ preserveDrawingBuffer: true, antialias: quality !== 'high' }}
      camera={{ position: [3.6, 4.6, 6.4], fov: 40, near: 0.05, far: 120 }}
      onPointerMissed={(e) => e.type === 'click' && deselect()}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 22, 60]} />
      <Suspense fallback={null}>
        <StudioEnvironment night={night} />
      </Suspense>
      <RoomLights night={night} width={bounds.width} depth={bounds.depth} quality={quality} />
      <House plan={plan} night={night} walls={walls} activeRoom={activeRoom} onFloorClick={deselect} />
      <Items />
      <DragController />
      <CameraRig />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.08}
        minDistance={1.2}
        maxDistance={40}
        target={[0, 0.4, 0]}
      />
      {quality === 'high' && <Effects />}
      <CaptureBridge />
    </Canvas>
  )
}
