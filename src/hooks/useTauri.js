import { isTauri, mockInvoke, mockConvertFileSrc } from '../lib/browserMock'
import { useState, useEffect } from 'react'

// Helper to get Tauri APIs
const getTauriAPIs = async () => {
  if (isTauri()) {
    const tauriCore = await import('@tauri-apps/api/core')
    const dialogMod = await import('@tauri-apps/plugin-dialog')
    const eventMod = await import('@tauri-apps/api/event')
    return {
      invoke: tauriCore.invoke,
      convertFileSrc: tauriCore.convertFileSrc,
      open: dialogMod.open,
      listen: eventMod.listen,
      _isTauri: true
    }
  } else {
    return {
      invoke: mockInvoke,
      convertFileSrc: mockConvertFileSrc,
      open: async () => null,
      listen: (name, cb) => {
        // Mock listen for browser
        console.log(`[MOCK LISTEN] ${name}`)
        return Promise.resolve(() => {})
      },
      _isTauri: false
    }
  }
}

// We can export them directly if they are ready, but top-level await might be tricky in some environments
// For now, let's provide a hook that returns them, or just export them if we know they'll be ready.

export const useTauri = () => {
  const [apis, setApis] = useState({
    invoke: mockInvoke,
    convertFileSrc: mockConvertFileSrc,
    open: async () => null,
    listen: async () => () => {},
    _isTauri: false,
    ready: false
  })

  useEffect(() => {
    getTauriAPIs().then(res => {
      setApis({ ...res, ready: true })
    })
  }, [])

  return apis
}

// Also export a sync version for direct use if needed (mocks initially)
export const tauriApis = {
  invoke: mockInvoke,
  convertFileSrc: mockConvertFileSrc,
  open: async () => null,
  _isTauri: isTauri()
}

// Initialize tauriApis if in Tauri
if (isTauri()) {
  import('@tauri-apps/api/core').then(m => {
    tauriApis.invoke = m.invoke
    tauriApis.convertFileSrc = m.convertFileSrc
  })
  import('@tauri-apps/plugin-dialog').then(m => {
    tauriApis.open = m.open
  })
}
