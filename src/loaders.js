import * as THREE from 'three'
import { Asset } from 'expo-asset'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import {
  readAsStringAsync,
  EncodingType,
  getInfoAsync,
  documentDirectory,
  cacheDirectory,
  makeDirectoryAsync,
  downloadAsync,
} from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Checks if gif directory exists. If not, creates it
async function ensureDirExists(dir) {
  const { exists } = await getInfoAsync(dir)
  if (!exists) {
    console.log(dir + " directory doesn't exist, creating...")
    await makeDirectoryAsync(dir, { intermediates: true })
  }
}

async function DownloadRemoteFile(url) {
  // This should probably have a provider that supports errors for full filesystems or other issues,
  // along with progress,

  // Document or Cache storage
  // TODO: Find a way to set this
  const isPermanent = true

  // Directories paths & setup
  const documentSubDirectory = documentDirectory + 'r3f-file-loader/'
  const cacheSubDirectory = cacheDirectory + 'r3f-file-loader/'
  const directory = isPermanent ? documentSubDirectory : cacheSubDirectory
  const localFilePath = `${directory}${encodeURIComponent(url)}`
  await ensureDirExists(localFilePath)

  // Download the file
  const { uri } = await downloadAsync(url, localFilePath)

  // Store the files path
  await AsyncStorage.setItem(`@r3f-file-loader/${encodeURIComponent(url)}`, uri)

  // return the local path
  return uri
}

export class AssetLoader extends THREE.Loader {
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

export class RemoteAssetLoader extends THREE.Loader {
  async load(url, onLoad, _, onError) {
    // This could be done in a better way that doesn't require remote files be immutable

    // Find the local file
    let localUri = await AsyncStorage.getItem(`@r3f-file-loader/${encodeURIComponent(url)}`)
    const localUriExists = localUri !== null ? (await getInfoAsync(localUri)).exists : false

    // Download the local file if it doesn't already exist
    if (localUri === null || !localUriExists) localUri = DownloadRemoteFile(url)

    // Return the file to AssetLoader
    const base64 = await readAsStringAsync(localUri, { encoding: EncodingType.Base64 })
    const arrayBuffer = decode(base64)
    new GLTFLoader().parse(arrayBuffer, undefined, onLoad, onError)
  }
}
