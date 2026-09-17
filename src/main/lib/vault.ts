import { IpcMain, safeStorage } from 'electron'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

interface ApiKeysVault {
  geminiKey?: string
  groqKey?: string
  hfKey?: string
  tavilyKey?: string
  ollamaEndpoint?: string
  ollamaModel?: string
}

const getVaultFilePath = () => {
  const userData = app.getPath('userData')
  return path.join(userData, 'iris_vault.enc')
}

export function loadVaultKeys(): ApiKeysVault {
  try {
    const filePath = getVaultFilePath()
    if (!fs.existsSync(filePath)) {
      return {
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'gemma3:12b'
      }
    }

    const fileBuffer = fs.readFileSync(filePath)
    if (safeStorage.isEncryptionAvailable()) {
      const decrypted = safeStorage.decryptString(fileBuffer)
      return JSON.parse(decrypted)
    } else {
      // Fallback base64 decoding if safeStorage is disabled in headless
      const raw = fileBuffer.toString('utf-8')
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
    }
  } catch (err) {
    console.error('[Vault] Error loading encrypted keys:', err)
    return {
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'gemma3:12b'
    }
  }
}

export function saveVaultKeys(keys: ApiKeysVault): boolean {
  try {
    const filePath = getVaultFilePath()
    const payloadStr = JSON.stringify(keys)

    if (safeStorage.isEncryptionAvailable()) {
      const encryptedBuffer = safeStorage.encryptString(payloadStr)
      fs.writeFileSync(filePath, encryptedBuffer)
    } else {
      const base64Str = Buffer.from(payloadStr, 'utf-8').toString('base64')
      fs.writeFileSync(filePath, base64Str, 'utf-8')
    }
    return true
  } catch (err) {
    console.error('[Vault] Error saving encrypted keys:', err)
    return false
  }
}

export default function registerVaultHandlers(ipcMain: IpcMain) {
  ipcMain.removeHandler('secure-get-keys')
  ipcMain.handle('secure-get-keys', async () => {
    return loadVaultKeys()
  })

  ipcMain.removeHandler('secure-save-keys')
  ipcMain.handle('secure-save-keys', async (_event, keys: ApiKeysVault) => {
    const success = saveVaultKeys(keys)
    if (!success) {
      throw new Error('Failed to encrypt and store keys in OS vault.')
    }
    return { success: true }
  })

  // Local Ollama proxy to prevent CORS issues from renderer
  ipcMain.removeHandler('ollama-query')
  ipcMain.handle(
    'ollama-query',
    async (_event, { endpoint, model, prompt }: { endpoint?: string; model?: string; prompt: string }) => {
      const keys = loadVaultKeys()
      const targetEndpoint = endpoint || keys.ollamaEndpoint || 'http://localhost:11434'
      const targetModel = model || keys.ollamaModel || 'gemma3:12b'

      try {
        const response = await fetch(`${targetEndpoint.replace(/\/$/, '')}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: targetModel,
            prompt,
            stream: false
          })
        })

        if (!response.ok) {
          throw new Error(`Ollama responded with status: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return { success: true, response: data.response }
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to connect to local Ollama instance' }
      }
    }
  )
}
