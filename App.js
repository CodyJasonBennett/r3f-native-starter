import React, { Suspense } from 'react'
import { useFrame, Canvas } from '@react-three/fiber/native'
import { useGLTF, Environment } from '@react-three/drei/native'
import iphoneModelPath from './assets/iphone.glb'

const Model = ({ url, ...rest }) => {
  const { scene } = useGLTF(url)
  useFrame(() => (scene.rotation.y += 0.01))
  return <primitive {...rest} object={scene} />
}

const App = () => (
  <Canvas gl={{ physicallyCorrectLights: true }} camera={{ position: [-6, 0, 16], fov: 36 }}>
    <color attach="background" args={[0xe2f4df]} />
    <ambientLight />
    <directionalLight intensity={1.1} position={[0.5, 0, 0.866]} />
    <directionalLight intensity={0.8} position={[-6, 2, 2]} />
    <Suspense fallback={null}>
      <Environment preset="park" />
      <Model url={iphoneModelPath} />
    </Suspense>
  </Canvas>
)

export default App
