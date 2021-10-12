import React, { useState, Suspense } from 'react'
import { useLoader, Canvas } from '@react-three/fiber'
import { RemoteAssetLoader } from './loaders'

const REMOTE_FILE_URL = 'http://223e-205-250-172-225.ngrok.io/cube.glb'

const Model = (props) => {
  const { scene } = useLoader(RemoteAssetLoader, REMOTE_FILE_URL)
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
