// Seating, tables and storage. Every model stands on y = 0, is centred on x/z
// and faces +z. Sizes come from the product's dims so the footprint used for
// collisions always matches what you see.
import { useMemo } from 'react'
import * as THREE from 'three'
import { Box, Brass, Cyl, Fabric, Lacquer, Lathe, Metal, RBox, Velvet, Wood } from './materials.jsx'
import { rng } from '../textures.js'

const DARK_WOOD = '#3b2a20'
const CREAM = '#f3eee6'

function corners(w, d, inset) {
  return [
    [w / 2 - inset, d / 2 - inset],
    [-(w / 2 - inset), d / 2 - inset],
    [w / 2 - inset, -(d / 2 - inset)],
    [-(w / 2 - inset), -(d / 2 - inset)],
  ]
}

function TaperedLegs({ w, d, inset, height, color = DARK_WOOD, top = 0.03, bottom = 0.018, splay = 0 }) {
  return corners(w, d, inset).map(([x, z], i) => (
    <Cyl
      key={i}
      args={[top, bottom, height, 14]}
      position={[x, height / 2, z]}
      rotation={[Math.sign(z) * splay, 0, -Math.sign(x) * splay]}
    >
      <Wood color={color} />
    </Cyl>
  ))
}

export function Sofa({ color, dims, seats = 3 }) {
  const { w, d, h } = dims
  const legH = 0.1
  const baseH = 0.22
  const armW = seats === 1 ? 0.17 : 0.16
  const backD = 0.2
  const armH = 0.64
  const innerW = w - armW * 2
  const cw = innerW / seats
  const seatTop = legH + baseH
  // Throw pillows: gold on cool/dark upholstery, deep blue on warm/light upholstery.
  const accent = useMemo(() => {
    const hsl = new THREE.Color(color).getHSL({})
    const warm = hsl.h < 0.16 || hsl.h > 0.9
    return warm && hsl.l > 0.35 ? '#2e4a62' : '#c8a45c'
  }, [color])
  return (
    <group>
      <TaperedLegs w={w} d={d} inset={0.09} height={legH} splay={0.12} />
      <RBox args={[w, baseH, d]} radius={0.04} position={[0, legH + baseH / 2, 0]}>
        <Fabric color={color} />
      </RBox>
      {[-1, 1].map((s) => (
        <RBox key={s} args={[armW, armH - legH, d]} radius={0.07} position={[s * (w / 2 - armW / 2), legH + (armH - legH) / 2, 0]}>
          <Fabric color={color} />
        </RBox>
      ))}
      <RBox args={[w, h - legH, backD]} radius={0.07} position={[0, legH + (h - legH) / 2, -d / 2 + backD / 2]}>
        <Fabric color={color} />
      </RBox>
      {Array.from({ length: seats }, (_, i) => {
        const x = -innerW / 2 + cw * (i + 0.5)
        return (
          <group key={i}>
            <RBox args={[cw - 0.012, 0.16, d - backD - 0.01]} radius={0.065} smoothness={5} position={[x, seatTop + 0.08, backD / 2]}>
              <Velvet color={color} />
            </RBox>
            <RBox
              args={[cw - 0.02, 0.42, 0.17]}
              radius={0.08}
              smoothness={5}
              position={[x, seatTop + 0.16 + 0.19, -d / 2 + backD + 0.07]}
              rotation={[-0.14, 0, 0]}
            >
              <Velvet color={color} />
            </RBox>
          </group>
        )
      })}
      {seats > 1 &&
        [-1, 1].map((s) => (
          <RBox
            key={s}
            args={[0.42, 0.42, 0.13]}
            radius={0.06}
            smoothness={5}
            position={[s * (innerW / 2 - 0.25), seatTop + 0.36, -d / 2 + backD + 0.2]}
            rotation={[-0.25, s * 0.35, s * 0.08]}
          >
            <Velvet color={accent} />
          </RBox>
        ))}
    </group>
  )
}

export function Armchair(props) {
  return <Sofa {...props} seats={1} />
}

export function Ottoman({ color, dims }) {
  const r = dims.w / 2
  const h = dims.h
  const points = useMemo(() => {
    const pts = [[0, 0.02]]
    for (let i = 0; i <= 16; i++) {
      const t = i / 16
      const y = 0.02 + t * (h - 0.02)
      pts.push([r * (0.9 + Math.sin(t * Math.PI) * 0.1) - (t > 0.92 ? (t - 0.92) * 2.2 * r : 0), y])
    }
    pts.push([0, h])
    return pts
  }, [r, h])
  return (
    <group>
      <Lathe points={points} segments={56}>
        <Velvet color={color} />
      </Lathe>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * r * 0.55, h - 0.005, Math.sin(a) * r * 0.55]} castShadow>
            <sphereGeometry args={[0.012, 10, 10]} />
            <Fabric color={color} />
          </mesh>
        )
      })}
      <mesh position={[0, h - 0.002, 0]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <Brass />
      </mesh>
    </group>
  )
}

export function CoffeeTable({ color, dims }) {
  const { w, d, h } = dims
  return (
    <group>
      <RBox args={[w, 0.045, d]} radius={0.015} position={[0, h - 0.0225, 0]}>
        <Wood color={color} gloss={0.5} />
      </RBox>
      <RBox args={[w - 0.12, 0.025, d - 0.1]} radius={0.01} position={[0, 0.12, 0]}>
        <Wood color={color} />
      </RBox>
      {corners(w, d, 0.05).map(([x, z], i) => (
        <Box key={i} args={[0.025, h - 0.045, 0.025]} position={[x, (h - 0.045) / 2, z]}>
          <Metal color="#1e1e1e" />
        </Box>
      ))}
      {/* a couple of books and a tray of istikan glasses on the lower shelf */}
      <Box args={[0.28, 0.035, 0.2]} position={[-w / 4, 0.15, 0]} rotation={[0, 0.2, 0]}>
        <Lacquer color="#2e4a62" />
      </Box>
      <Box args={[0.25, 0.03, 0.18]} position={[-w / 4, 0.18, 0]} rotation={[0, 0.05, 0]}>
        <Lacquer color="#c8a45c" />
      </Box>
    </group>
  )
}

export function SideTable({ color, dims }) {
  const { w, h } = dims
  return (
    <group>
      <Cyl args={[w / 2, w / 2, 0.035, 48]} position={[0, h - 0.0175, 0]}>
        <Wood color={color} gloss={0.5} />
      </Cyl>
      <Cyl args={[0.03, 0.04, h - 0.05, 20]} position={[0, (h - 0.05) / 2 + 0.015, 0]}>
        <Metal color="#1e1e1e" />
      </Cyl>
      <Cyl args={[w * 0.32, w * 0.34, 0.02, 40]} position={[0, 0.01, 0]}>
        <Metal color="#1e1e1e" />
      </Cyl>
    </group>
  )
}

export function Nightstand({ color, dims }) {
  const { w, d, h } = dims
  const legH = 0.08
  const bodyH = h - legH
  return (
    <group>
      <TaperedLegs w={w} d={d} inset={0.04} height={legH} color={color} top={0.018} bottom={0.012} splay={0.1} />
      <RBox args={[w, bodyH, d]} radius={0.012} position={[0, legH + bodyH / 2, 0]}>
        <Wood color={color} />
      </RBox>
      {[0, 1].map((i) => {
        const dh = (bodyH - 0.06) / 2
        const y = legH + 0.03 + dh * (i + 0.5)
        return (
          <group key={i}>
            <RBox args={[w - 0.04, dh - 0.012, 0.018]} radius={0.006} position={[0, y, d / 2 + 0.005]}>
              <Wood color={color} />
            </RBox>
            <Box args={[0.1, 0.012, 0.012]} position={[0, y, d / 2 + 0.02]}>
              <Brass />
            </Box>
          </group>
        )
      })}
    </group>
  )
}

export function DiningTable({ color, dims }) {
  const { w, d, h } = dims
  const topT = 0.05
  return (
    <group>
      <RBox args={[w, topT, d]} radius={0.02} position={[0, h - topT / 2, 0]}>
        <Wood color={color} gloss={0.6} />
      </RBox>
      <Box args={[w - 0.2, 0.08, d - 0.2]} position={[0, h - topT - 0.04, 0]}>
        <Wood color={color} />
      </Box>
      <TaperedLegs w={w} d={d} inset={0.12} height={h - topT} color={color} top={0.04} bottom={0.025} />
      {/* table runner */}
      <Box args={[0.36, 0.004, d + 0.002]} position={[0, h + 0.002, 0]} castShadow={false}>
        <Fabric color="#8e2f2a" />
      </Box>
    </group>
  )
}

export function DiningChair({ color, dims }) {
  const { w, d, h } = dims
  const seatH = 0.46
  return (
    <group>
      <TaperedLegs w={w} d={d} inset={0.04} height={seatH - 0.04} color={DARK_WOOD} top={0.018} bottom={0.014} splay={0.06} />
      <RBox args={[w, 0.08, d - 0.02]} radius={0.03} position={[0, seatH - 0.02, 0.01]}>
        <Velvet color={color} />
      </RBox>
      {[-1, 1].map((s) => (
        <Box key={s} args={[0.025, h - seatH, 0.025]} position={[s * (w / 2 - 0.03), seatH + (h - seatH) / 2, -d / 2 + 0.03]} rotation={[-0.08, 0, 0]}>
          <Wood color={DARK_WOOD} />
        </Box>
      ))}
      <RBox args={[w, 0.2, 0.035]} radius={0.015} position={[0, h - 0.12, -d / 2 + 0.01]} rotation={[-0.1, 0, 0]}>
        <Wood color={DARK_WOOD} />
      </RBox>
    </group>
  )
}

export function Bed({ color, dims }) {
  const { w, d, h } = dims
  const legH = 0.08
  const frameH = 0.3
  const headT = 0.12
  const mattressTop = legH + frameH + 0.24
  const buttons = []
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) buttons.push([(c - 2.5) * (w / 6.5), 0.62 + r * 0.14])
  return (
    <group>
      <TaperedLegs w={w} d={d} inset={0.08} height={legH} top={0.03} bottom={0.025} />
      <RBox args={[w, frameH, d - headT]} radius={0.05} position={[0, legH + frameH / 2, headT / 2]}>
        <Fabric color={color} />
      </RBox>
      <RBox args={[w + 0.06, h - legH, headT]} radius={0.05} position={[0, legH + (h - legH) / 2, -d / 2 + headT / 2]}>
        <Velvet color={color} />
      </RBox>
      {buttons.map(([x, y], i) => (
        <mesh key={i} position={[x, y + legH, -d / 2 + headT + 0.002]}>
          <sphereGeometry args={[0.012, 10, 10]} />
          <Fabric color={color} />
        </mesh>
      ))}
      {/* mattress */}
      <RBox args={[w - 0.06, 0.24, d - headT - 0.06]} radius={0.06} smoothness={5} position={[0, legH + frameH + 0.12, headT / 2]}>
        <Fabric color={CREAM} />
      </RBox>
      {/* duvet with a folded edge */}
      <RBox args={[w + 0.02, 0.07, d * 0.62]} radius={0.035} smoothness={5} position={[0, mattressTop + 0.02, d / 2 - d * 0.31 + 0.02]}>
        <Fabric color="#e9e3d8" />
      </RBox>
      <RBox args={[w + 0.03, 0.08, 0.28]} radius={0.04} smoothness={5} position={[0, mattressTop + 0.06, d / 2 - d * 0.62 + 0.14]}>
        <Fabric color="#e9e3d8" />
      </RBox>
      {/* blanket throw at the foot of the bed */}
      <RBox args={[w + 0.04, 0.05, 0.5]} radius={0.025} position={[0, mattressTop + 0.06, d / 2 - 0.33]}>
        <Velvet color={color} />
      </RBox>
      {/* pillows */}
      {[-1, 1].map((s) => (
        <RBox
          key={s}
          args={[w / 2 - 0.12, 0.15, 0.4]}
          radius={0.07}
          smoothness={6}
          position={[s * (w / 4 - 0.01), mattressTop + 0.08, -d / 2 + headT + 0.26]}
          rotation={[-0.35, 0, 0]}
        >
          <Fabric color="#fbf8f2" />
        </RBox>
      ))}
    </group>
  )
}

export function Wardrobe({ color, dims }) {
  const { w, d, h } = dims
  const plinth = 0.08
  const doors = 3
  const dw = w / doors
  return (
    <group>
      <Box args={[w - 0.04, plinth, d - 0.04]} position={[0, plinth / 2, -0.01]}>
        <Lacquer color="#2b2622" />
      </Box>
      <RBox args={[w, h - plinth, d]} radius={0.01} position={[0, plinth + (h - plinth) / 2, 0]}>
        <Wood color={color} />
      </RBox>
      <RBox args={[w + 0.04, 0.04, d + 0.03]} radius={0.01} position={[0, h - 0.02, 0.005]}>
        <Wood color={color} />
      </RBox>
      {Array.from({ length: doors }, (_, i) => {
        const x = -w / 2 + dw * (i + 0.5)
        const handleX = i === 0 ? dw / 2 - 0.06 : i === doors - 1 ? -dw / 2 + 0.06 : dw / 2 - 0.06
        return (
          <group key={i} position={[x, plinth + (h - plinth - 0.04) / 2, d / 2 + 0.008]}>
            <RBox args={[dw - 0.008, h - plinth - 0.08, 0.02]} radius={0.006}>
              <Wood color={color} />
            </RBox>
            <RBox args={[dw - 0.14, h - plinth - 0.32, 0.008]} radius={0.003} position={[0, 0, 0.012]}>
              <Wood color={color} />
            </RBox>
            <Cyl args={[0.007, 0.007, 0.32, 10]} position={[handleX, 0, 0.03]}>
              <Brass />
            </Cyl>
          </group>
        )
      })}
    </group>
  )
}

export function Bookshelf({ color, dims }) {
  const { w, d, h } = dims
  const t = 0.025
  const shelves = 5
  const gap = (h - t) / shelves
  const books = useMemo(() => {
    const rand = rng(42)
    const palette = ['#8e2f2a', '#2e4a62', '#c8a45c', '#38463a', '#e8dfcf', '#5b3a4a', '#b5643c', '#1f2f45']
    const list = []
    for (let s = 0; s < shelves; s++) {
      let x = -w / 2 + t + 0.01
      const end = w / 2 - t - 0.01
      const skipFrom = -w / 2 + (0.25 + rand() * 0.4) * w
      while (x < end - 0.03) {
        if (x > skipFrom && x < skipFrom + 0.22) {
          x += 0.24 // leave a gap for decor
          continue
        }
        const bw = 0.022 + rand() * 0.03
        const bh = Math.min(gap - 0.04, 0.17 + rand() * 0.12)
        const bd = d * (0.65 + rand() * 0.25)
        if (x + bw > end) break
        list.push({ x: x + bw / 2, y: t + s * gap + bh / 2, w: bw, h: bh, d: bd, c: palette[Math.floor(rand() * palette.length)] })
        x += bw + 0.002
      }
    }
    return list
  }, [w, d, gap])
  return (
    <group>
      {[-1, 1].map((s) => (
        <Box key={s} args={[t, h, d]} position={[s * (w / 2 - t / 2), h / 2, 0]}>
          <Wood color={color} />
        </Box>
      ))}
      <Box args={[w, h, 0.012]} position={[0, h / 2, -d / 2 + 0.006]}>
        <Wood color={color} />
      </Box>
      {Array.from({ length: shelves + 1 }, (_, i) => (
        <Box key={i} args={[w - 2 * t, t, d - 0.012]} position={[0, t / 2 + i * gap, 0.006]}>
          <Wood color={color} />
        </Box>
      ))}
      {books.map((b, i) => (
        <Box key={i} args={[b.w, b.h, b.d]} position={[b.x, b.y, d / 2 - b.d / 2 - 0.02]}>
          <Lacquer color={b.c} />
        </Box>
      ))}
    </group>
  )
}

export function Desk({ color, dims }) {
  const { w, d, h } = dims
  const topT = 0.035
  const pedW = 0.4
  return (
    <group>
      <RBox args={[w, topT, d]} radius={0.012} position={[0, h - topT / 2, 0]}>
        <Wood color={color} gloss={0.4} />
      </RBox>
      <RBox args={[pedW, h - topT, d - 0.04]} radius={0.008} position={[w / 2 - pedW / 2 - 0.02, (h - topT) / 2, 0]}>
        <Wood color={color} />
      </RBox>
      {[0, 1, 2].map((i) => {
        const dh = (h - topT - 0.04) / 3
        return (
          <group key={i} position={[w / 2 - pedW / 2 - 0.02, 0.02 + dh * (i + 0.5), d / 2 - 0.015]}>
            <RBox args={[pedW - 0.03, dh - 0.012, 0.016]} radius={0.004}>
              <Wood color={color} />
            </RBox>
            <Box args={[0.12, 0.01, 0.012]} position={[0, dh / 2 - 0.04, 0.014]}>
              <Brass />
            </Box>
          </group>
        )
      })}
      {[-1, 1].map((s) => (
        <group key={s} position={[-w / 2 + 0.06, 0, s * (d / 2 - 0.06)]}>
          <Box args={[0.03, h - topT, 0.03]} position={[0, (h - topT) / 2, 0]}>
            <Metal color="#1e1e1e" />
          </Box>
        </group>
      ))}
      <Box args={[0.03, 0.03, d - 0.12]} position={[-w / 2 + 0.06, 0.1, 0]}>
        <Metal color="#1e1e1e" />
      </Box>
    </group>
  )
}

export function TvUnit({ color, dims, lit }) {
  const { w, d, h } = dims
  const legH = 0.08
  const bodyH = h - legH
  const tvW = Math.min(1.45, w * 0.8)
  const tvH = tvW * 0.5625
  return (
    <group>
      <TaperedLegs w={w} d={d} inset={0.06} height={legH} color={DARK_WOOD} top={0.02} bottom={0.014} />
      <RBox args={[w, bodyH, d]} radius={0.012} position={[0, legH + bodyH / 2, 0]}>
        <Wood color={color} />
      </RBox>
      {[0, 1, 2].map((i) => {
        const fw = (w - 0.04) / 3
        return (
          <group key={i} position={[-w / 2 + 0.02 + fw * (i + 0.5), legH + bodyH / 2, d / 2 + 0.006]}>
            <RBox args={[fw - 0.01, bodyH - 0.04, 0.014]} radius={0.004}>
              <Wood color={color} />
            </RBox>
            {/* fluted slats on the middle door */}
            {i === 1 &&
              Array.from({ length: 9 }, (_, k) => (
                <Cyl key={k} args={[0.01, 0.01, bodyH - 0.07, 8]} position={[(k - 4) * (fw / 10), 0, 0.008]}>
                  <Wood color={color} />
                </Cyl>
              ))}
          </group>
        )
      })}
      {/* television */}
      <group position={[0, h, -d / 2 + 0.16]}>
        <Box args={[0.36, 0.012, 0.2]} position={[0, 0.006, 0]}>
          <Metal color="#151515" />
        </Box>
        <Box args={[0.05, 0.08, 0.03]} position={[0, 0.05, -0.02]}>
          <Metal color="#151515" />
        </Box>
        <Box args={[tvW, tvH, 0.03]} position={[0, 0.07 + tvH / 2, -0.02]}>
          <meshStandardMaterial color="#111" roughness={0.6} metalness={0.4} />
        </Box>
        <mesh position={[0, 0.07 + tvH / 2, -0.004]}>
          <planeGeometry args={[tvW - 0.02, tvH - 0.02]} />
          <meshPhysicalMaterial
            color={lit ? '#24384e' : '#050608'}
            emissive={lit ? '#2a4a6b' : '#000000'}
            emissiveIntensity={lit ? 0.8 : 0}
            roughness={0.08}
            clearcoat={1}
            metalness={0.2}
          />
        </mesh>
      </group>
    </group>
  )
}
