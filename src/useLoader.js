import * as THREE from 'three'
import { Asset } from 'expo-asset'
import { readAsStringAsync } from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { useAsset } from 'use-asset'

function buildGraph(object) {
  const data = { nodes: {}, materials: {} }
  if (object) {
    object.traverse((obj) => {
      if (obj.name) {
        data.nodes[obj.name] = obj
      }
      if (obj.material && !data.materials[obj.material.name]) {
        data.materials[obj.material.name] = obj.material
      }
    })
  }
  return data
}

/**
 * Generates an asset based on input type.
 */
const getAsset = (input) => {
  if (input instanceof Asset) return input

  switch (typeof input) {
    case 'string':
      return Asset.fromURI(input)
    case 'number':
      return Asset.fromModule(input)
    default:
      throw 'Invalid asset! Must be a URI or module.'
  }
}

/**
 * Downloads from a local URI and decodes into an ArrayBuffer.
 */
const toBuffer = async (localUri) => readAsStringAsync(localUri, { encoding: 'base64' }).then(decode)

function loadingFn(extensions, onProgress) {
  return function (Proto, ...input) {
    // Construct new loader and run extensions
    const loader = new Proto()
    if (extensions) extensions(loader)
    // Go through the urls and load them
    return Promise.all(
      input.map(
        (url) =>
          new Promise(async (res, reject) => {
            // There's no Image in native, so we create & pass a data texture instead.
            if (loader.constructor.name === 'TextureLoader') {
              const asset = await getAsset(url).downloadAsync()

              const texture = new THREE.DataTexture()
              texture.image = { data: asset, width: asset.width, height: asset.height }

              return res(texture)
            }

            // Do similar for CubeTextures
            if (loader.constructor.name === 'CubeTextureLoader') {
              const texture = new THREE.CubeTexture()

              texture.images = await Promise.all(
                url.map(async (src) => {
                  const asset = await getAsset(src).downloadAsync()
                  return { data: asset, width: asset.width, height: asset.height }
                }),
              )
              texture.needsUpdate = true

              return res(texture)
            }

            // Generate a buffer from cached url
            const { localUri } = await getAsset(url).downloadAsync()
            const arrayBuffer = await toBuffer(localUri)

            // Parse it
            const parsed = loader.parse(
              arrayBuffer,
              undefined,
              (data) => {
                if (data.scene) Object.assign(data, buildGraph(data.scene))
                res(data)
              },
              (error) => reject(`Could not load ${url}: ${error.message}`),
            )

            if (parsed) return res(parsed)
          }),
      ),
    )
  }
}

function useLoader(Proto, input, extensions, onProgress) {
  // Use suspense to load async assets
  const keys = Array.isArray(input) ? input : [input]
  const results = useAsset(loadingFn(extensions, onProgress), Proto, ...keys)
  // Return the object/s
  return Array.isArray(input) ? results : results[0]
}

useLoader.preload = function (Proto, input, extensions) {
  const keys = Array.isArray(input) ? input : [input]
  return useAsset.preload(loadingFn(extensions), Proto, ...keys)
}

useLoader.clear = function (Proto, input) {
  const keys = Array.isArray(input) ? input : [input]
  return useAsset.clear(Proto, ...keys)
}

export default useLoader
