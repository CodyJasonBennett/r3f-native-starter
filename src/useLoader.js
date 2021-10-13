import * as THREE from 'three'
import { Asset } from 'expo-asset'
import { readAsStringAsync, EncodingType } from 'expo-file-system'
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
  switch (typeof input) {
    case 'string':
      return Asset.fromURI(input)
    case 'number':
      return Asset.fromModule(input)
    default:
      throw 'Invalid asset! Must be a local or external reference.'
  }
}

/**
 * Generates a URI from a filepath and caches it.
 */
const getUri = async (url) => {
  const asset = getAsset(url)
  const { localUri } = await asset.downloadAsync()

  return localUri
}

/**
 * Converts a URI to an ArrayBuffer.
 */
const toBuffer = async (uri) =>
  readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  }).then(decode)

function loadingFn(extensions, onProgress) {
  return function (Proto, ...input) {
    // Construct new loader and run extensions
    const loader = new Proto()
    if (extensions) extensions(loader)
    // Go through the urls and load them
    return Promise.all(
      input.map(
        (input) =>
          new Promise(async (res, reject) => {
            // There's no Image in native, so we create & pass a data texture instead.
            if (loader.constructor.name === 'TextureLoader') {
              const asset = await getAsset(input).downloadAsync()

              const texture = new THREE.Texture()
              texture.isDataTexture = true
              texture.image = { data: asset, width: asset.width, height: asset.height }
              texture.needsUpdate = true

              return res(texture)
            }

            // Generate a buffer from cached input
            const uri = await getUri(input)
            const arrayBuffer = await toBuffer(uri)

            // Parse it
            return loader.parse(
              arrayBuffer,
              undefined,
              (data) => {
                if (data.scene) Object.assign(data, buildGraph(data.scene))
                res(data)
              },
              (error) => reject(`Could not load ${input}: ${error.message}`),
            )
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
