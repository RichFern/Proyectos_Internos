import type { AppData } from '../types'
import { loadData, saveData } from './storage'
import { BRAND } from './brand'

const BACKUP_VERSION = 1

export interface BackupFile {
  app: typeof BRAND.appId | typeof BRAND.legacyAppId
  version: number
  exportedAt: string
  note?: string
  data: AppData
}

export function buildBackup(note?: string): BackupFile {
  return {
    app: BRAND.appId,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    note,
    data: loadData(),
  }
}

export function downloadBackup(note?: string): void {
  const backup = buildBackup(note)
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const day = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `a-la-par-respaldo-${day}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseBackup(raw: string): BackupFile {
  const parsed = JSON.parse(raw) as BackupFile
  const okApp =
    parsed.app === BRAND.appId || parsed.app === BRAND.legacyAppId
  if (!okApp || !parsed.data?.spaces) {
    throw new Error(`El archivo no es un respaldo de ${BRAND.name}`)
  }
  return parsed
}

export function restoreBackup(backup: BackupFile): AppData {
  saveData(backup.data)
  return backup.data
}

export async function readBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text()
  return parseBackup(text)
}
