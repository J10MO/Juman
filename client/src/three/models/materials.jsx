import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { fabricBump, woodGrain } from '../textures.js'

export function Fabric({ color, roughness = 0.92 }) {
  const bump = fabricBump()
  return <meshStandardMaterial color={color} roughness={roughness} bumpMap={bump} bumpScale={0.5} />
}

export function Velvet({ color }) {
  const bump = fabricBump()
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.8}
      sheen={1}
      sheenRoughness={0.45}
      sheenColor={new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45)}
      bumpMap={bump}
      bumpScale={0.35}
    />
  )
}

export function Wood({ color, gloss = 0.25 }) {
  const map = woodGrain()
  return <meshPhysicalMaterial color={color} map={map} roughness={0.55} clearcoat={gloss} clearcoatRoughness={0.4} />
}

export function Lacquer({ color }) {
  return <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.25} />
}

export function Metal({ color = '#2a2a2a', roughness = 0.32 }) {
  return <meshStandardMaterial color={color} metalness={0.9} roughness={roughness} />
}

export function Brass() {
  return <meshStandardMaterial color="#c8a45c" metalness={1} roughness={0.28} />
}

export function Ceramic({ color }) {
  return <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.15} />
}

export function Clay({ color = '#b5643c' }) {
  return <meshStandardMaterial color={color} roughness={0.95} />
}

/** RoundedBox that never crashes when the radius is too large for the box. */
export function RBox({ args, radius = 0.03, smoothness = 4, children, ...props }) {
  const r = Math.max(0.001, Math.min(radius, Math.min(...args) / 2 - 0.002))
  return (
    <RoundedBox args={args} radius={r} smoothness={smoothness} castShadow receiveShadow {...props}>
      {children}
    </RoundedBox>
  )
}

export function Box({ args, children, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <boxGeometry args={args} />
      {children}
    </mesh>
  )
}

export function Cyl({ args, children, ...props }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      <cylinderGeometry args={args} />
      {children}
    </mesh>
  )
}

/** Lathe from a list of [radius, height] points. */
export function Lathe({ points, segments = 48, children, ...props }) {
  const geometry = useMemo(
    () => new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(points), segments],
  )
  return (
    <mesh geometry={geometry} castShadow receiveShadow {...props}>
      {children}
    </mesh>
  )
}

let leafGeometry
/** Shared leaf geometry: a 1-unit long, slightly curved leaf pointing +Y. */
export function getLeafGeometry() {
  if (leafGeometry) return leafGeometry
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.bezierCurveTo(0.22, 0.25, 0.2, 0.7, 0, 1)
  shape.bezierCurveTo(-0.2, 0.7, -0.22, 0.25, 0, 0)
  const g = new THREE.ShapeGeometry(shape, 8)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const x = pos.getX(i)
    pos.setZ(i, y * y * 0.25 + Math.abs(x) * 0.3) // curl back and fold along the midrib
  }
  g.computeVertexNormals()
  leafGeometry = g
  return g
}
