import * as THREE from 'three'
import { Asset } from 'expo-asset'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {
  readAsStringAsync,
  EncodingType,
  getInfoAsync,
  cacheDirectory,
  makeDirectoryAsync,
  downloadAsync,
} from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Generates a URI from a filepath and caches it.
 */
const getUri = async (url) => {
  // If a local file is specified, don't cache it
  if (!url.startsWith?.('http')) return (await Asset.fromModule(url).downloadAsync()).localUri

  // If remote file is already cached, return it
  const cached = await AsyncStorage.getItem(`@r3f-file-loader/${encodeURIComponent(url)}`)
  if (cached && (await getInfoAsync(cached)).exists) return cached

  // Get cached file path
  const localFilePath = `${cacheDirectory}r3f/${encodeURIComponent(url)}`

  // Create cache directory
  const { exists } = await getInfoAsync(localFilePath)
  if (!exists) await makeDirectoryAsync(localFilePath, { intermediates: true })

  // Download the file
  const { uri } = await downloadAsync(url, localFilePath)

  // Store generated URI in cache
  await AsyncStorage.setItem(`@r3f-file-loader/${encodeURIComponent(url)}`, uri)

  return uri
}

/**
 * Converts a URI to an ArrayBuffer.
 */
const toBuffer = async (uri) =>
  readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  }).then(decode)

export class AssetLoader extends THREE.Loader {
  async load(url, onLoad, _, onError) {
    const uri = await getUri(url)
    const arrayBuffer = await toBuffer(uri)

    new GLTFLoader().parse(arrayBuffer, undefined, onLoad, onError)
  }
}
