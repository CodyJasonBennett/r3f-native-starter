import React, { useState, Suspense } from 'react'
import * as THREE from 'three'
import { Asset } from 'expo-asset'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { useLoader, Canvas } from '@react-three/fiber'
import { readAsStringAsync, EncodingType } from 'expo-file-system'
import { decode } from 'base64-arraybuffer'

class AssetLoader extends THREE.Loader {
  async load(url, onLoad, _, onError) {
    const asset = Asset.fromModule(url)
    const { localUri } = await asset.downloadAsync()
    const base64 = await readAsStringAsync(localUri, {
      encoding: EncodingType.Base64,
    })
    const arrayBuffer = decode(base64)
    new GLTFLoader().parse(arrayBuffer, undefined, onLoad, onError)
  }
}

const Model = (props) => {
  const { scene } = useLoader(AssetLoader, require('./cube.glb'))
  return <primitive {...props} object={scene} />
}

const App = () => {
  const [color, setColor] = useState('white')

  return (
    <Canvas>
      <ambientLight />
      <Suspense fallback={null}>
        <Model
          scale={0.5}
          children-0-material-color={color}
          onClick={() => setColor((value) => (value === 'white' ? 'red' : 'white'))}
        />
      </Suspense>
    </Canvas>
  )
}

export default App
