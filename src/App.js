import React, { Suspense, useEffect } from 'react'
import { TextureLoader, sRGBEncoding, MeshBasicMaterial } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { useThree, Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei/core/Environment'
import useLoader from './useLoader'
import iphoneModelPath from '../assets/iphone.glb'
import screenTexturePath from '../assets/screen-texture.jpg'

const Model = ({ url, screenUrl, ...rest }) => {
  const { gl } = useThree()
  const { scene } = useLoader(GLTFLoader, url)
  const texture = useLoader(TextureLoader, screenUrl)

  useEffect(() => {
    scene.traverse((node) => {
      if (node.name === 'Screen') {
        texture.encoding = sRGBEncoding
        texture.flipY = false
        texture.anisotropy = gl.capabilities.getMaxAnisotropy()
        node.material = new MeshBasicMaterial({ map: texture })
      }
    })
  }, [texture])

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
      <Model url={iphoneModelPath} screenUrl={screenTexturePath} />
    </Suspense>
  </Canvas>
)

export default App
