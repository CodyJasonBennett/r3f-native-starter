import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei/core/Environment'
import useLoader from './useLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// const REMOTE_FILE_URL = 'https://raw.githack.com/CodyJasonBennett/r3f-native-starter/main/assets/cube.glb'

const Model = (props) => {
  const { scene } = useLoader(GLTFLoader, require('../assets/iphone.glb'))
  return <primitive {...props} object={scene} />
}

const App = () => (
  <Canvas camera={{ position: [-6, 0, 16], fov: 36 }} onCreated={({ gl }) => (gl.physicallyCorrectLights = true)}>
    <color attach="background" args={[0xe2f4df]} />
    <ambientLight />
    <directionalLight intensity={1.1} position={[0.5, 0, 0.866]} />
    <directionalLight intensity={0.8} position={[-6, 2, 2]} />
    <Suspense fallback={null}>
      <Environment preset="park" />
      <Model />
    </Suspense>
  </Canvas>
)

export default App
