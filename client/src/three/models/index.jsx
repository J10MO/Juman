import { Suspense, memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  Armchair, Bed, Bookshelf, CoffeeTable, Desk, DiningChair, DiningTable, Nightstand, Ottoman, SideTable, Sofa, TvUnit,
  Wardrobe,
} from './furniture.jsx'
import { FloorLamp, OliveTree, Rug, SmallPlant, TableLamp, Vase } from './decor.jsx'
import {
  AirCooler, Bathtub, FloorFan, Fridge, Heater, KitchenCounter, Stove, Toilet, Vanity, WashingMachine,
} from './appliances.jsx'

export const MODELS = {
  sofa: Sofa,
  armchair: Armchair,
  ottoman: Ottoman,
  'coffee-table': CoffeeTable,
  'side-table': SideTable,
  nightstand: Nightstand,
  'tv-unit': TvUnit,
  'dining-table': DiningTable,
  'dining-chair': DiningChair,
  bed: Bed,
  wardrobe: Wardrobe,
  bookshelf: Bookshelf,
  desk: Desk,
  rug: Rug,
  'floor-lamp': FloorLamp,
  'table-lamp': TableLamp,
  vase: Vase,
  'small-plant': SmallPlant,
  'olive-tree': OliveTree,
  'kitchen-counter': KitchenCounter,
  fridge: Fridge,
  stove: Stove,
  'washing-machine': WashingMachine,
  toilet: Toilet,
  vanity: Vanity,
  bathtub: Bathtub,
  'air-cooler': AirCooler,
  heater: Heater,
  'floor-fan': FloorFan,
}

/** A real, photo-scanned model (GLB). Each instance gets its own scene graph. */
function ScannedModel({ url }) {
  const { scene } = useGLTF(url)
  const object = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    return clone
  }, [scene])
  return <primitive object={object} />
}

/** Pulsing outline shown while a scanned model downloads. */
function LoadingBox({ dims }) {
  const mat = useRef()
  useFrame(({ clock }) => {
    if (mat.current) mat.current.opacity = 0.18 + Math.sin(clock.elapsedTime * 4) * 0.1
  })
  return (
    <mesh position={[0, dims.h / 2, 0]}>
      <boxGeometry args={[dims.w, dims.h, dims.d]} />
      <meshBasicMaterial ref={mat} color="#c8a45c" transparent opacity={0.2} depthWrite={false} />
    </mesh>
  )
}

/**
 * Renders a product's 3D model. `lit` turns lamps (and the TV) on.
 * `suspend` lets a parent Suspense boundary wait for scanned models (used by
 * the thumbnail renderer); otherwise a placeholder box shows while loading.
 */
export const FurnitureModel = memo(function FurnitureModel({ product, color, lit = false, suspend = false }) {
  const ref = useRef()
  const isRug = product.kind === 'rug'

  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = !isRug && o.castShadow !== false
        o.receiveShadow = true
      }
    })
  })

  if (product.modelUrl) {
    const model = <ScannedModel url={product.modelUrl} />
    return <group ref={ref}>{suspend ? model : <Suspense fallback={<LoadingBox dims={product.dims} />}>{model}</Suspense>}</group>
  }

  // model keys may carry a variant, e.g. "rug:kilim"
  const [key, variant] = product.modelKey.split(':')
  const Model = MODELS[key]
  if (!Model) return null
  return (
    <group ref={ref}>
      <Model
        color={color && color !== 'natural' ? color : product.colors?.[0] || '#cccccc'}
        dims={product.dims}
        lit={lit}
        variant={variant}
      />
    </group>
  )
})

export const preloadModel = (product) => product?.modelUrl && useGLTF.preload(product.modelUrl)
