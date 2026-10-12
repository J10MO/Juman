// Kitchen, bathroom and the appliances every Iraqi house has.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Box, Brass, Ceramic, Cyl, Lacquer, Lathe, Metal, RBox, Wood } from './materials.jsx'

const STEEL = '#c9ccd1'
const WHITE = '#f4f2ee'

function Steel({ color = STEEL, roughness = 0.28 }) {
  return <meshStandardMaterial color={color} metalness={0.85} roughness={roughness} />
}

function Plastic({ color, roughness = 0.45 }) {
  return <meshPhysicalMaterial color={color} roughness={roughness} clearcoat={0.3} clearcoatRoughness={0.4} />
}

function Glass({ tint = '#1b2430', opacity = 0.55 }) {
  return <meshPhysicalMaterial color={tint} roughness={0.05} metalness={0.1} clearcoat={1} transparent opacity={opacity} />
}

function Faucet({ position, scale = 1 }) {
  const tube = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(0, 0.27, 0.06),
      new THREE.Vector3(0, 0.22, 0.14),
    ])
    return new THREE.TubeGeometry(curve, 24, 0.012, 10, false)
  }, [])
  return (
    <group position={position} scale={scale}>
      <Cyl args={[0.025, 0.028, 0.03, 16]} position={[0, 0.015, 0]}>
        <Steel />
      </Cyl>
      <mesh geometry={tube} castShadow>
        <Steel roughness={0.15} />
      </mesh>
      <Box args={[0.012, 0.012, 0.07]} position={[0.035, 0.05, 0]}>
        <Steel roughness={0.15} />
      </Box>
    </group>
  )
}

/** Base cabinets with worktop, a steel sink and wall cabinets above. */
export function KitchenCounter({ color, dims }) {
  const { w, d, h } = dims
  const plinth = 0.1
  const top = 0.04
  const bodyH = h - plinth - top
  const doors = Math.max(2, Math.round(w / 0.6))
  const dw = w / doors
  const sinkX = -w / 2 + Math.min(0.9, w * 0.3)
  return (
    <group>
      <Box args={[w - 0.04, plinth, d - 0.08]} position={[0, plinth / 2, -0.04]}>
        <Lacquer color="#2b2622" />
      </Box>
      <Box args={[w, bodyH, d - 0.04]} position={[0, plinth + bodyH / 2, -0.02]}>
        <Lacquer color={color} />
      </Box>
      {Array.from({ length: doors }, (_, i) => (
        <group key={i} position={[-w / 2 + dw * (i + 0.5), plinth + bodyH / 2, d / 2 - 0.03]}>
          <RBox args={[dw - 0.008, bodyH - 0.01, 0.02]} radius={0.004}>
            <Lacquer color={color} />
          </RBox>
          <Box args={[0.16, 0.012, 0.014]} position={[0, bodyH / 2 - 0.07, 0.017]}>
            <Steel />
          </Box>
        </group>
      ))}
      {/* stone worktop */}
      <RBox args={[w + 0.02, top, d]} radius={0.008} position={[0, h - top / 2, 0]}>
        <meshPhysicalMaterial color="#e8e4dc" roughness={0.25} clearcoat={0.5} />
      </RBox>
      {/* sink */}
      <group position={[sinkX, h + 0.001, 0.02]}>
        <Box args={[0.62, 0.006, 0.44]} position={[0, 0, 0]}>
          <Steel roughness={0.35} />
        </Box>
        <Box args={[0.54, 0.004, 0.36]} position={[0, 0.002, 0]} castShadow={false}>
          <meshStandardMaterial color="#5d6168" metalness={0.8} roughness={0.4} />
        </Box>
        <Faucet position={[0, 0, -0.24]} />
      </group>
      {/* backsplash tiles */}
      <Box args={[w, 0.55, 0.012]} position={[0, h + 0.275, -d / 2 + 0.006]}>
        <meshPhysicalMaterial color="#dfe7e6" roughness={0.2} clearcoat={0.8} />
      </Box>
      {/* wall cabinets */}
      <group position={[0, h + 0.55 + 0.36, -d / 2 + 0.18]}>
        <Box args={[w, 0.72, 0.34]}>
          <Lacquer color={color} />
        </Box>
        {Array.from({ length: doors }, (_, i) => (
          <group key={i} position={[-w / 2 + dw * (i + 0.5), 0, 0.175]}>
            <RBox args={[dw - 0.008, 0.71, 0.018]} radius={0.004}>
              <Lacquer color={color} />
            </RBox>
            <Box args={[0.012, 0.12, 0.014]} position={[i % 2 ? -dw / 2 + 0.05 : dw / 2 - 0.05, -0.27, 0.016]}>
              <Steel />
            </Box>
          </group>
        ))}
      </group>
    </group>
  )
}

export function Fridge({ color, dims }) {
  const { w, d, h } = dims
  const split = h * 0.32
  return (
    <group>
      <RBox args={[w, h - 0.03, d - 0.05]} radius={0.03} position={[0, (h - 0.03) / 2 + 0.03, -0.025]}>
        <Plastic color={color} />
      </RBox>
      {/* freezer door on top, fridge door below */}
      {[
        { dh: split - 0.015, y: h - split / 2, handleY: -(split - 0.015) / 2 + 0.18 },
        { dh: h - split - 0.045, y: 0.03 + (h - split - 0.045) / 2, handleY: (h - split - 0.045) / 2 - 0.3 },
      ].map(({ dh, y, handleY }, i) => (
        <group key={i} position={[0, y, d / 2 - 0.03]}>
          <RBox args={[w - 0.01, dh, 0.05]} radius={0.02}>
            <meshPhysicalMaterial color={color} roughness={0.2} metalness={color === STEEL ? 0.7 : 0} clearcoat={0.8} />
          </RBox>
          <Box args={[0.02, Math.min(0.5, dh * 0.5), 0.03]} position={[w / 2 - 0.06, handleY, 0.04]}>
            <Steel roughness={0.18} />
          </Box>
        </group>
      ))}
      <Box args={[0.08, 0.03, 0.005]} position={[-w / 2 + 0.12, h - split - 0.12, d / 2 + 0.0]}>
        <meshStandardMaterial color="#1a2a3a" emissive="#4fc3f7" emissiveIntensity={0.6} />
      </Box>
    </group>
  )
}

export function Stove({ color, dims }) {
  const { w, d, h } = dims
  const burners = [
    [-w / 4, -d / 6, 0.07], [w / 4, -d / 6, 0.07], [-w / 4, d / 6, 0.055], [w / 4, d / 6, 0.055], [0, 0, 0.09],
  ]
  return (
    <group>
      <Box args={[w, h - 0.03, d]} position={[0, (h - 0.03) / 2, 0]}>
        <Plastic color={color} />
      </Box>
      <Box args={[w, 0.03, d]} position={[0, h - 0.015, 0]}>
        <Steel roughness={0.3} />
      </Box>
      {burners.map(([x, z, r], i) => (
        <group key={i} position={[x, h, z]}>
          <Cyl args={[r, r, 0.015, 24]} position={[0, 0.008, 0]}>
            <meshStandardMaterial color="#1c1c1c" metalness={0.6} roughness={0.5} />
          </Cyl>
          {[0, Math.PI / 2].map((a) => (
            <Box key={a} args={[r * 2.6, 0.012, 0.012]} position={[0, 0.022, 0]} rotation={[0, a, 0]}>
              <meshStandardMaterial color="#111" metalness={0.5} roughness={0.6} />
            </Box>
          ))}
        </group>
      ))}
      {/* oven door */}
      <group position={[0, h * 0.42, d / 2 + 0.01]}>
        <RBox args={[w - 0.06, h * 0.55, 0.02]} radius={0.01}>
          <Plastic color={color} />
        </RBox>
        <Box args={[w - 0.22, h * 0.3, 0.005]} position={[0, -0.02, 0.012]}>
          <Glass />
        </Box>
        <Cyl args={[0.01, 0.01, w - 0.2, 10]} position={[0, h * 0.24, 0.04]} rotation={[0, 0, Math.PI / 2]}>
          <Steel roughness={0.15} />
        </Cyl>
      </group>
      {Array.from({ length: 5 }, (_, i) => (
        <Cyl key={i} args={[0.018, 0.018, 0.025, 16]} position={[(i - 2) * (w / 6), h - 0.09, d / 2 + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#222" roughness={0.4} />
        </Cyl>
      ))}
    </group>
  )
}

export function WashingMachine({ color, dims }) {
  const { w, d, h } = dims
  return (
    <group>
      <RBox args={[w, h, d]} radius={0.02} position={[0, h / 2, 0]}>
        <Plastic color={color} roughness={0.35} />
      </RBox>
      <Box args={[w - 0.04, 0.1, 0.01]} position={[0, h - 0.07, d / 2]}>
        <Plastic color="#e9e8e4" />
      </Box>
      <Cyl args={[0.03, 0.03, 0.02, 20]} position={[w / 2 - 0.1, h - 0.07, d / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <Steel />
      </Cyl>
      <Box args={[0.12, 0.04, 0.005]} position={[-w / 2 + 0.14, h - 0.07, d / 2 + 0.006]}>
        <meshStandardMaterial color="#111" emissive="#7bd88f" emissiveIntensity={0.5} />
      </Box>
      <group position={[0, h * 0.45, d / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <torusGeometry args={[w * 0.3, 0.03, 16, 48]} />
          <Steel color="#d6d8dc" roughness={0.2} />
        </mesh>
        <Cyl args={[w * 0.28, w * 0.28, 0.02, 48]}>
          <Glass tint="#28323e" opacity={0.75} />
        </Cyl>
      </group>
    </group>
  )
}

export function Toilet({ color, dims }) {
  const { d } = dims
  return (
    <group>
      <Lathe points={[[0, 0], [0.12, 0], [0.11, 0.15], [0.15, 0.3], [0.17, 0.38], [0, 0.38]]} scale={[1, 1, 1.25]} position={[0, 0, 0.05]}>
        <Ceramic color={color} />
      </Lathe>
      <mesh position={[0, 0.395, 0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]} castShadow>
        <torusGeometry args={[0.14, 0.025, 12, 40]} />
        <Ceramic color={color} />
      </mesh>
      <RBox args={[0.38, 0.38, 0.18]} radius={0.04} position={[0, 0.58, -d / 2 + 0.09]}>
        <Ceramic color={color} />
      </RBox>
      <RBox args={[0.4, 0.03, 0.2]} radius={0.012} position={[0, 0.785, -d / 2 + 0.09]}>
        <Ceramic color={color} />
      </RBox>
      <Cyl args={[0.025, 0.025, 0.012, 20]} position={[0, 0.805, -d / 2 + 0.09]}>
        <Steel roughness={0.15} />
      </Cyl>
      {/* bidet spray hose — every Iraqi bathroom has one */}
      <Cyl args={[0.012, 0.016, 0.12, 12]} position={[0.24, 0.55, -d / 2 + 0.05]} rotation={[0, 0, 0.3]}>
        <Steel roughness={0.15} />
      </Cyl>
    </group>
  )
}

export function Vanity({ color, dims }) {
  const { w, d, h } = dims
  const cabH = 0.82
  return (
    <group>
      <Box args={[w, cabH - 0.12, d - 0.04]} position={[0, 0.12 + (cabH - 0.12) / 2, -0.02]}>
        <Wood color={color} />
      </Box>
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * w) / 4, 0.12 + (cabH - 0.12) / 2, d / 2 - 0.02]}>
          <RBox args={[w / 2 - 0.01, cabH - 0.14, 0.02]} radius={0.004}>
            <Wood color={color} />
          </RBox>
          <Box args={[0.012, 0.14, 0.014]} position={[-s * (w / 4 - 0.05), 0.1, 0.016]}>
            <Brass />
          </Box>
        </group>
      ))}
      <RBox args={[w + 0.02, 0.1, d]} radius={0.03} position={[0, cabH + 0.05, 0]}>
        <Ceramic color={WHITE} />
      </RBox>
      <Box args={[w * 0.6, 0.02, d * 0.55]} position={[0, cabH + 0.091, 0.02]} castShadow={false}>
        <meshPhysicalMaterial color="#e3e1dc" roughness={0.15} clearcoat={1} />
      </Box>
      <Faucet position={[0, cabH + 0.1, -d / 2 + 0.07]} scale={0.8} />
      {/* mirror */}
      <group position={[0, h - 0.4, -d / 2 + 0.02]}>
        <RBox args={[w * 0.9, 0.75, 0.03]} radius={0.01}>
          <Brass />
        </RBox>
        <mesh position={[0, 0, 0.017]}>
          <planeGeometry args={[w * 0.9 - 0.05, 0.7]} />
          <meshStandardMaterial color="#dfe6ea" metalness={1} roughness={0.04} />
        </mesh>
      </group>
    </group>
  )
}

export function Bathtub({ color, dims }) {
  const { w, d, h } = dims
  const t = 0.07
  return (
    <group>
      <RBox args={[w, h - 0.06, d]} radius={0.06} position={[0, (h - 0.06) / 2 + 0.06, 0]}>
        <Ceramic color={color} />
      </RBox>
      {/* inner basin: darker, slightly lower */}
      <RBox args={[w - t * 2, 0.05, d - t * 2]} radius={0.06} position={[0, h - 0.02, 0]}>
        <meshPhysicalMaterial color="#d9e3e8" roughness={0.1} clearcoat={1} />
      </RBox>
      <mesh position={[0, h - 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w - t * 2 - 0.06, d - t * 2 - 0.06]} />
        <meshPhysicalMaterial color="#9fd3e6" roughness={0.02} transmission={0} transparent opacity={0.55} clearcoat={1} />
      </mesh>
      <Faucet position={[w / 2 - 0.12, h, 0]} />
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - 0.12), 0.03, sz * (d / 2 - 0.1)]} castShadow>
          <sphereGeometry args={[0.04, 12, 12]} />
          <Brass />
        </mesh>
      ))}
    </group>
  )
}

/** مبردة هواء — evaporative air cooler with pads on three sides and front louvres. */
export function AirCooler({ color, dims }) {
  const { w, d, h } = dims
  const wheels = 0.08
  const bodyH = h - wheels
  return (
    <group>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (w / 2 - 0.06), 0.035, sz * (d / 2 - 0.06)]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
          <meshStandardMaterial color="#222" roughness={0.6} />
        </mesh>
      ))}
      <RBox args={[w, bodyH, d]} radius={0.02} position={[0, wheels + bodyH / 2, 0]}>
        <Plastic color={color} />
      </RBox>
      {/* straw pads behind grilles on the sides and back */}
      {[
        [w / 2 + 0.002, 0, Math.PI / 2, d - 0.1],
        [-w / 2 - 0.002, 0, -Math.PI / 2, d - 0.1],
        [0, -d / 2 - 0.002, Math.PI, w - 0.1],
      ].map(([x, z, ry, len], i) => (
        <group key={i} position={[x, wheels + bodyH * 0.45, z]} rotation={[0, ry, 0]}>
          <mesh>
            <planeGeometry args={[len, bodyH * 0.62]} />
            <meshStandardMaterial color="#c8a35a" roughness={1} />
          </mesh>
          {Array.from({ length: 12 }, (_, k) => (
            <Box key={k} args={[len, 0.012, 0.012]} position={[0, -bodyH * 0.3 + k * (bodyH * 0.6 / 11), 0.008]}>
              <Plastic color={color} />
            </Box>
          ))}
        </group>
      ))}
      {/* front louvres */}
      <group position={[0, wheels + bodyH * 0.62, d / 2 + 0.01]}>
        <Box args={[w * 0.72, bodyH * 0.42, 0.01]}>
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </Box>
        {Array.from({ length: 9 }, (_, k) => (
          <Box key={k} args={[w * 0.7, 0.008, 0.05]} position={[0, -bodyH * 0.19 + k * (bodyH * 0.38 / 8), 0.02]} rotation={[-0.4, 0, 0]}>
            <Plastic color={color} />
          </Box>
        ))}
      </group>
      {/* control panel */}
      <Box args={[w * 0.5, 0.05, 0.01]} position={[0, wheels + bodyH * 0.24, d / 2 + 0.005]}>
        <meshStandardMaterial color="#1d3557" roughness={0.5} />
      </Box>
      {[-1, 0, 1].map((k) => (
        <Cyl key={k} args={[0.016, 0.016, 0.02, 14]} position={[k * 0.08, wheels + bodyH * 0.24, d / 2 + 0.018]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#e9e9e9" roughness={0.4} />
        </Cyl>
      ))}
    </group>
  )
}

/** صوبة علاء الدين — the classic blue kerosene heater; glows at night. */
export function Heater({ color, dims, lit }) {
  const { h } = dims
  const r = dims.w / 2
  return (
    <group>
      <Cyl args={[r, r * 1.02, 0.08, 40]} position={[0, 0.04, 0]}>
        <Lacquer color={color} />
      </Cyl>
      <Cyl args={[r * 0.88, r * 0.9, h * 0.42, 40]} position={[0, 0.08 + h * 0.21, 0]}>
        <Lacquer color={color} />
      </Cyl>
      {/* window with the flame */}
      <Cyl args={[r * 0.78, r * 0.8, h * 0.28, 40, 1, true]} position={[0, 0.08 + h * 0.42 + h * 0.14, 0]}>
        <meshStandardMaterial
          color={lit ? '#ffb347' : '#3a3a3a'}
          emissive="#ff7a1a"
          emissiveIntensity={lit ? 2.2 : 0}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </Cyl>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <Cyl key={i} args={[0.005, 0.005, h * 0.28, 6]} position={[Math.cos(a) * r * 0.8, 0.08 + h * 0.56, Math.sin(a) * r * 0.8]}>
            <Metal color="#2c2c2c" />
          </Cyl>
        )
      })}
      <Lathe points={[[r * 0.82, 0], [r * 0.7, 0.05], [r * 0.25, 0.09], [0, 0.1]]} position={[0, 0.08 + h * 0.7, 0]}>
        <Metal color="#2f2f2f" roughness={0.35} />
      </Lathe>
      <mesh position={[0, h - 0.04, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[r * 0.55, 0.01, 8, 30, Math.PI]} />
        <Metal color="#2f2f2f" />
      </mesh>
      {lit && <pointLight color="#ff9a3c" intensity={1.6} distance={4} decay={2} position={[0, h * 0.6, 0]} />}
    </group>
  )
}

/** پانكة أرضية — standing fan with spinning blades. */
export function FloorFan({ color, dims }) {
  const { h } = dims
  const blades = useRef()
  const headY = h - 0.2
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 14
  })
  const bladeShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.bezierCurveTo(0.06, 0.05, 0.08, 0.14, 0.03, 0.17)
    s.bezierCurveTo(-0.02, 0.15, -0.03, 0.06, 0, 0)
    return new THREE.ShapeGeometry(s, 8)
  }, [])
  return (
    <group>
      <Cyl args={[0.2, 0.22, 0.04, 36]} position={[0, 0.02, 0]}>
        <Plastic color={color} />
      </Cyl>
      <Cyl args={[0.016, 0.02, headY - 0.04, 12]} position={[0, 0.04 + (headY - 0.04) / 2, 0]}>
        <Steel />
      </Cyl>
      <group position={[0, headY, 0]}>
        <RBox args={[0.12, 0.12, 0.16]} radius={0.05} position={[0, 0, -0.08]}>
          <Plastic color={color} />
        </RBox>
        <group position={[0, 0, 0.03]}>
          {[0.2, 0.13].map((r) => (
            <mesh key={r} castShadow>
              <torusGeometry args={[r, 0.004, 6, 48]} />
              <Steel />
            </mesh>
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <Box key={i} args={[0.003, 0.4, 0.003]} rotation={[0, 0, (i / 16) * Math.PI]}>
              <Steel />
            </Box>
          ))}
          <group ref={blades} position={[0, 0, -0.03]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} geometry={bladeShape} rotation={[0, 0.25, (i / 3) * Math.PI * 2]} castShadow>
                <meshPhysicalMaterial color="#9ec9e8" transparent opacity={0.8} side={THREE.DoubleSide} roughness={0.2} />
              </mesh>
            ))}
            <Cyl args={[0.03, 0.03, 0.03, 16]} rotation={[Math.PI / 2, 0, 0]}>
              <Plastic color={color} />
            </Cyl>
          </group>
        </group>
      </group>
    </group>
  )
}
