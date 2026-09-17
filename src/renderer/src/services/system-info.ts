export interface SystemStats {
  cpu: string
  memory: {
    total: string
    free: string
    usedPercentage: string
  }
  temperature: number
  os: {
    type: string
    uptime: string
  }
  network: {
    tx: number
    rx: number
    latency: number
  }
}

export interface AppItem {
  name: string
  id: string
}

export const getSystemStatus = async (): Promise<SystemStats | null> => {
  try {
    return await window.electron.ipcRenderer.invoke('get-system-stats')
  } catch (error) {
    return null
  }
}

export const getAllApps = async (): Promise<AppItem[]> => {
  try {
    const apps = await window.electron.ipcRenderer.invoke('get-installed-apps')
    return Array.isArray(apps) ? apps : []
  } catch (error) {
    return []
  }
}

export const getDrives = async (): Promise<any[]> => {
  try {
    return await window.electron.ipcRenderer.invoke('get-drives')
  } catch (error) {
    return []
  }
}

export type HazardLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ProductivityLogItem {
  id: string
  timestamp: string
  action: string
  hazardLevel: HazardLevel
  intercepted: boolean
  timeSavedMinutes: number
}

export interface ProductivityMetrics {
  totalActionsExecuted: number
  hazardsIntercepted: number
  hoursSaved: number
  activeWorkflows: number
  recentLogs: ProductivityLogItem[]
}

export interface CognitiveThought {
  phase1_deconstruction: {
    intent: string
    activeContext: string
    targetResources: string[]
  }
  phase2_blast_radius: {
    hazardLevel: HazardLevel
    destructive: boolean
    reversible: boolean
    affectedScope: string
  }
  phase3_critique_correction: {
    userImpulseCritique: string
    modelSelfCorrection: string
    safetyOverrideNeeded: boolean
    recommendedAlternative?: string
  }
  phase4_action_strategy: {
    approved: boolean
    executionPlan: string
    userPromptRequired: boolean
    confirmationMessage?: string
  }
  rawThoughtText: string
}

export const getProductivityMetrics = async (): Promise<ProductivityMetrics | null> => {
  try {
    return await window.electron.ipcRenderer.invoke('get-productivity-metrics')
  } catch (error) {
    return null
  }
}

export const evaluateCognitiveIntent = async (
  intent: string,
  context?: any
): Promise<CognitiveThought | null> => {
  try {
    return await window.electron.ipcRenderer.invoke('cognitive-evaluate', { intent, context })
  } catch (error) {
    return null
  }
}

export const queryOllama = async (
  prompt: string,
  endpoint?: string,
  model?: string
): Promise<{ success: boolean; response?: string; error?: string }> => {
  try {
    return await window.electron.ipcRenderer.invoke('ollama-query', { prompt, endpoint, model })
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

