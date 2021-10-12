import * as React from 'react'
import { Asset } from 'expo-asset'
import {
  downloadAsync,
  getInfoAsync,
  cacheDirectory,
  makeDirectoryAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system'
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

export function useGraph(object) {
  return React.useMemo(() => buildGraph(object), [object])
}

/**
 * Generates a URI from a filepath and caches it.
 */
const getUri = async (url) => {
  // If asset is local, don't cache it
  if (!url.startsWith?.('http')) return (await Asset.fromModule(url).downloadAsync()).localUri

  // Create cached file path
  const localFilePath = `${cacheDirectory}r3f/${encodeURIComponent(url)}`

  // Create cache directory
  const { exists } = await getInfoAsync(localFilePath)
  if (!exists) await makeDirectoryAsync(localFilePath, { intermediates: true })

  // Download the file
  const { uri } = await downloadAsync(url, localFilePath)

  return uri
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
            const uri = await getUri(input)
            const arrayBuffer = await toBuffer(uri)

            loader.parse(
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
