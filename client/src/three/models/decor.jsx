import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Brass, Ceramic, Clay, Cyl, Lathe, Metal, getLeafGeometry } from './materials.jsx'
import { rng, rugTexture } from '../textures.js'

const WARM = '#ffd9a0'

export function Rug({ color, dims }) {
  const map = rugTexture(color)
  return (
    <mesh position={[0, dims.h / 2, 0]} receiveShadow>
      <boxGeometry args={[dims.w, dims.h, dims.d]} />
      <meshStandardMaterial map={map} roughness={1} bumpMap={map} bumpScale={0.6} />
    </mesh>
  )
}

function LampShade({ radiusTop, radiusBottom, height, color, lit }) {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 48, 1, true]} />
        <meshStandardMaterial
          color={color}
          side={THREE.DoubleSide}
          roughness={0.9}
          emissive={WARM}
          emissiveIntensity={lit ? 0.9 : 0}
          transparent
          opacity={0.96}
        />
      </mesh>
      <mesh position={[0, -height * 0.15, 0]}>
        <sphereGeometry args={[Math.min(radiusTop, radiusBottom) * 0.35, 16, 16]} />
        <meshStandardMaterial color="#fff6e5" emissive={WARM} emissiveIntensity={lit ? 4 : 0.05} />
      </mesh>
    </group>
  )
}

export function FloorLamp({ color, dims, lit }) {
  const h = dims.h
  const shadeH = 0.32
  return (
    <group>
      <Cyl args={[0.15, 0.16, 0.03, 40]} position={[0, 0.015, 0]}>
        <Metal color="#1f1f1f" roughness={0.25} />
      </Cyl>
      <Cyl args={[0.012, 0.012, h - shadeH * 0.6, 12]} position={[0, (h - shadeH * 0.6) / 2, 0]}>
        <Brass />
      </Cyl>
      <group position={[0, h - shadeH / 2, 0]}>
        <LampShade radiusTop={0.15} radiusBottom={dims.w / 2} height={shadeH} color={color} lit={lit} />
        {lit && <pointLight color={WARM} intensity={2.4} distance={6} decay={2} position={[0, -0.05, 0]} />}
      </group>
    </group>
  )
}

export function TableLamp({ color, dims, lit }) {
  const h = dims.h
  const r = dims.w / 2
  return (
    <group>
      <Lathe
        points={[
          [0, 0], [0.07, 0], [0.085, 0.03], [0.1, 0.1], [0.085, 0.18], [0.03, 0.24], [0.02, 0.27], [0, 0.27],
        ]}
      >
        <Ceramic color={color === '#f1e6d0' ? '#2e4a62' : color} />
      </Lathe>
      <Cyl args={[0.006, 0.006, 0.08, 8]} position={[0, 0.3, 0]}>
        <Brass />
      </Cyl>
      <group position={[0, h - 0.09, 0]}>
        <LampShade radiusTop={r * 0.65} radiusBottom={r} height={0.18} color="#f1e6d0" lit={lit} />
        {lit && <pointLight color={WARM} intensity={0.9} distance={3.5} decay={2} />}
      </group>
    </group>
  )
}

export function Vase({ color, dims }) {
  const branches = useMemo(() => {
    const rand = rng(5)
    return Array.from({ length: 6 }, () => ({
      tilt: (rand() - 0.5) * 0.7,
      yaw: rand() * Math.PI * 2,
      len: 0.18 + rand() * 0.14,
    }))
  }, [])
  return (
    <group>
      <Lathe
        points={[
          [0, 0], [0.05, 0], [0.085, 0.05], [0.095, 0.11], [0.07, 0.19], [0.035, 0.24], [0.04, 0.26], [0.03, 0.26], [0, 0.22],
        ]}
      >
        <Clay color={color} />
      </Lathe>
      {branches.map((b, i) => (
        <group key={i} position={[0, 0.24, 0]} rotation={[b.tilt, b.yaw, 0]}>
          <Cyl args={[0.002, 0.004, b.len, 5]} position={[0, b.len / 2, 0]}>
            <meshStandardMaterial color="#4b3a2a" roughness={1} />
          </Cyl>
          <mesh position={[0, b.len, 0]} castShadow>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color="#c8a45c" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh visible={false}>
        <boxGeometry args={[dims.w, dims.h, dims.d]} />
      </mesh>
    </group>
  )
}

/** Instanced leaves. Each leaf: [position, rotation (euler), scale]. */
function Leaves({ leaves, colors }) {
  const ref = useRef()
  const geometry = getLeafGeometry()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const c = new THREE.Color()
    leaves.forEach((l, i) => {
      e.set(l.rot[0], l.rot[1], l.rot[2], l.order || 'XYZ')
      q.setFromEuler(e)
      m.compose(new THREE.Vector3(...l.pos), q, new THREE.Vector3(l.scale * 0.45, l.scale, l.scale))
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c.set(colors[i % colors.length]).offsetHSL(0, 0, (l.shade - 0.5) * 0.12))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [leaves, colors])
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, leaves.length]} castShadow receiveShadow>
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.7} />
    </instancedMesh>
  )
}

const PLANT_GREENS = ['#3f6b35', '#4f7d3f', '#2f5a2c', '#5b8a45']
const OLIVE_GREENS = ['#7d8f5a', '#6e8050', '#93a273', '#5f7148']

export function SmallPlant({ color, dims }) {
  const potH = 0.13
  const leaves = useMemo(() => {
    const rand = rng(9)
    // Leaf points +Y: tilt it outwards around X, then spin it around the stem (YXZ order).
    return Array.from({ length: 26 }, () => ({
      pos: [0, potH + 0.01, 0],
      rot: [0.2 + rand() * 0.9, rand() * Math.PI * 2, 0],
      order: 'YXZ',
      scale: 0.1 + rand() * 0.1,
      shade: rand(),
    }))
  }, [])
  return (
    <group>
      <Lathe points={[[0, 0], [0.07, 0], [0.085, potH], [0.08, potH], [0, potH - 0.01]]}>
        <Ceramic color={color} />
      </Lathe>
      <Cyl args={[0.078, 0.078, 0.01, 24]} position={[0, potH - 0.012, 0]}>
        <meshStandardMaterial color="#3a2a1f" roughness={1} />
      </Cyl>
      <Leaves leaves={leaves} colors={PLANT_GREENS} />
      <mesh visible={false}>
        <boxGeometry args={[dims.w, dims.h, dims.d]} />
      </mesh>
    </group>
  )
}

export function OliveTree({ color, dims }) {
  const potH = 0.34
  const { trunk, leaves } = useMemo(() => {
    const rand = rng(21)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, potH - 0.02, 0),
      new THREE.Vector3(0.03, 0.6, 0.01),
      new THREE.Vector3(-0.03, 0.85, -0.02),
      new THREE.Vector3(0.02, 1.05, 0.02),
    ])
    const trunk = new THREE.TubeGeometry(curve, 24, 0.022, 8, false)
    const clusters = [
      [0.0, 1.22, 0.0, 0.2],
      [0.13, 1.08, 0.05, 0.15],
      [-0.12, 1.12, -0.06, 0.15],
      [0.05, 1.0, -0.12, 0.13],
      [-0.06, 0.96, 0.11, 0.12],
      [0.0, 1.36, 0.02, 0.12],
    ]
    const leaves = []
    clusters.forEach(([cx, cy, cz, r]) => {
      for (let i = 0; i < 110; i++) {
        const u = rand() * Math.PI * 2
        const v = Math.acos(2 * rand() - 1)
        const rr = r * Math.cbrt(rand())
        leaves.push({
          pos: [cx + rr * Math.sin(v) * Math.cos(u), cy + rr * Math.cos(v) * 0.75, cz + rr * Math.sin(v) * Math.sin(u)],
          rot: [rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2],
          scale: 0.05 + rand() * 0.03,
          shade: rand(),
        })
      }
    })
    return { trunk, leaves }
  }, [])
  return (
    <group>
      <Lathe
        points={[[0, 0], [0.15, 0], [0.19, potH - 0.04], [0.21, potH - 0.03], [0.21, potH], [0.19, potH], [0, potH - 0.04]]}
      >
        {color === '#b5643c' ? <Clay color={color} /> : <Ceramic color={color} />}
      </Lathe>
      <Cyl args={[0.188, 0.188, 0.01, 32]} position={[0, potH - 0.035, 0]}>
        <meshStandardMaterial color="#3a2a1f" roughness={1} />
      </Cyl>
      <mesh geometry={trunk} castShadow>
        <meshStandardMaterial color="#6b5a48" roughness={1} />
      </mesh>
      <Leaves leaves={leaves} colors={OLIVE_GREENS} />
      <mesh visible={false}>
        <boxGeometry args={[dims.w, dims.h, dims.d]} />
      </mesh>
    </group>
  )
}
