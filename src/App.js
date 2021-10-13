import React, { useMemo, useEffect, Suspense } from 'react'
import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { useThree, Canvas } from '@react-three/fiber'
import { presetsObj } from '@react-three/drei/helpers/environment-assets'
import useLoader from './useLoader'
import iphoneModelPath from '../assets/iphone.glb'
import screenTexturePath from '../assets/screen-texture.jpg'

const CUBEMAP_ROOT = 'https://rawcdn.githack.com/pmndrs/drei-assets/aa3600359ba664d546d05821bcbca42013587df2'

const Environment = ({ background = false, preset }) => {
  const { gl, scene } = useThree()
  const data = useLoader(RGBELoader, `${CUBEMAP_ROOT}/hdri/${presetsObj[preset]}`)
  const texture = useMemo(() => {
    const gen = new THREE.PMREMGenerator(gl)
    const texture = gen.fromEquirectangular(data).texture
    gen.dispose()

    return texture
  }, [])

  useEffect(() => {
    scene.environment = texture
    if (background) scene.background = texture
  }, [texture, background])

  return null
}

const Model = ({ url, screenUrl, ...rest }) => {
  const { gl } = useThree()
  const { scene } = useLoader(GLTFLoader, url)
  const texture = useLoader(THREE.TextureLoader, screenUrl)

  useEffect(() => {
    scene.traverse((node) => {
      if (node.name === 'Screen') {
        texture.encoding = THREE.sRGBEncoding
        texture.flipY = false
        texture.anisotropy = gl.capabilities.getMaxAnisotropy()
        node.material = new THREE.MeshBasicMaterial({ map: texture })
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
