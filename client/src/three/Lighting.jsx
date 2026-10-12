import { Environment, Lightformer } from '@react-three/drei'

/**
 * Image-based lighting built from light panels, so it works offline and gives
 * soft, realistic reflections on lacquer, metal and glass.
 */
export function StudioEnvironment({ night = false, intensity = 1 }) {
  const k = (night ? 0.18 : 1) * intensity
  return (
    <Environment resolution={256} frames={1} key={night ? 'night' : 'day'}>
      <color attach="background" args={[night ? '#05070c' : '#c9c3b8']} />
      <Lightformer form="rect" intensity={3 * k} color={night ? '#6d7fa8' : '#fffaf0'} position={[0, 5, -6]} scale={[8, 4, 1]} />
      <Lightformer form="rect" intensity={1.6 * k} color="#ffffff" position={[-6, 3, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={1.2 * k} color={night ? '#ffcf8a' : '#ffffff'} position={[6, 3, 2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
      <Lightformer form="circle" intensity={4 * k} color="#ffffff" position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={4} />
      <Lightformer form="rect" intensity={0.6 * k} color="#d8c7a8" position={[0, -2, 4]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
    </Environment>
  )
}

/** Sun through the window + soft ceiling light; lamps take over at night. */
export function RoomLights({ night, width, depth, quality = 'high' }) {
  const size = Math.max(width, depth) / 2 + 1.5
  const mapSize = quality === 'high' ? 2048 : 1024
  return (
    <>
      <hemisphereLight args={[night ? '#3b4766' : '#fff8ee', night ? '#120e0a' : '#b49a7a', night ? 0.12 : 0.45]} />
      {!night && (
        <directionalLight
          position={[1.8, 5.5, -depth / 2 - 4]}
          intensity={3.2}
          color="#fff1d6"
          castShadow
          shadow-mapSize={[mapSize, mapSize]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-radius={6}
          shadow-camera-left={-size}
          shadow-camera-right={size}
          shadow-camera-top={size}
          shadow-camera-bottom={-size}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
        />
      )}
      <directionalLight
        position={[-1.5, 9, 3]}
        intensity={night ? 0.35 : 1.1}
        color={night ? '#ffd49a' : '#ffffff'}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={10}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
      />
    </>
  )
}
