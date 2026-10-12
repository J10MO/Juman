// Renders product thumbnails with one shared off-screen WebGL renderer, so the
// catalogue can show real 3D renders without opening a WebGL context per card.
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createRoot, extend, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { FurnitureModel } from './models/index.jsx'
import { StudioEnvironment } from './Lighting.jsx'

// <Canvas> registers the THREE namespace itself; a bare createRoot() does not.
extend(THREE)

const SIZE = 480
const cache = new Map()
const queue = []
let root = null
let busy = false

function ThumbScene({ job }) {
  return (
    <>
      <StudioEnvironment />
      <Suspense fallback={null}>
        <ThumbContent job={job} />
      </Suspense>
    </>
  )
}

function ThumbContent({ job }) {
  const { camera, gl, invalidate } = useThree()
  const frames = useRef(0)
  const { product } = job
  const { w, d, h } = product.dims

  const model = useRef()

  // Frame the real geometry (some models, like the TV unit, reach beyond their footprint).
  useLayoutEffect(() => {
    const sphere = new THREE.Box3().setFromObject(model.current).getBoundingSphere(new THREE.Sphere())
    const dist = (sphere.radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.08
    const flat = h < 0.05
    const dir = new THREE.Vector3(...(flat ? [0.25, 0.9, 0.36] : [0.62, 0.42, 0.66])).normalize()
    camera.position.copy(sphere.center).addScaledVector(dir, dist)
    camera.lookAt(sphere.center)
    camera.updateProjectionMatrix()
    frames.current = 0
    invalidate()
  }, [job, camera, h, invalidate])

  // Render on demand: a few frames per thumbnail (shadows/env settle), then idle.
  useFrame(() => {
    frames.current += 1
    if (frames.current < 4) invalidate()
    if (frames.current === 4) {
      let url = gl.domElement.toDataURL('image/webp', 0.9)
      if (!url.startsWith('data:image/webp')) url = gl.domElement.toDataURL('image/png')
      job.resolve(url)
    }
  })

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[2.5, 5, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-2, 2, 2, -2, 0.5, 15]} />
      </directionalLight>
      <group ref={model}>
        <FurnitureModel key={product.id + job.color} product={product} color={job.color} lit suspend />
      </group>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={Math.max(w, d) * 2.2} blur={2.4} far={Math.max(1, h)} resolution={256} />
    </>
  )
}

async function pump() {
  if (busy) return
  busy = true
  while (queue.length) {
    const job = queue.shift()
    try {
      if (!root) {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = SIZE
        root = createRoot(canvas)
        root.configure({
          size: { width: SIZE, height: SIZE, top: 0, left: 0 },
          dpr: 1,
          frameloop: 'demand',
          shadows: 'soft',
          gl: { preserveDrawingBuffer: true, alpha: true, antialias: true },
          camera: { fov: 26, near: 0.05, far: 60 },
        })
      }
      const url = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 20000)
        root.render(<ThumbScene job={{ ...job, resolve: (u) => (clearTimeout(timer), resolve(u)) }} />)
      })
      job.done(url)
    } catch (err) {
      console.warn('thumbnail failed', err)
      job.done(null)
    }
  }
  busy = false
}

export function getThumbnail(product, color) {
  const key = `${product.modelUrl || product.modelKey}|${color}|${product.dims.w}x${product.dims.d}x${product.dims.h}`
  if (!cache.has(key)) {
    cache.set(
      key,
      new Promise((done) => {
        queue.push({ product, color, done })
        pump()
      }),
    )
  }
  return cache.get(key)
}

export function useThumbnail(product, color) {
  const [url, setUrl] = useState(null)
  const c = color || product?.colors?.[0]
  useEffect(() => {
    if (!product) return
    let alive = true
    setUrl(null)
    getThumbnail(product, c).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [product, c])
  return url
}
