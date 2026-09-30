import { promises as fs } from 'node:fs'
import { existsSync } from 'node:fs'
import path from 'node:path'

export interface SiteSettings {
  appName: string
  isStreamEnabled: boolean
  isReplayEnabled: boolean
  streamNotice?: string
  replayNotice?: string
  updatedAt: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  appName: 'Pekerja48',
  isStreamEnabled: true,
  isReplayEnabled: true,
  streamNotice: 'Fitur Live Stream saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.',
  replayNotice: 'Fitur Arsip Replay saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.',
  updatedAt: new Date().toISOString()
}

/**
 * Menentukan path file settings.json.
 * Prioritas:
 * 1. process.env.SETTINGS_FILE
 * 2. process.env.DATA_DIR + /settings.json
 * 3. <project-root>/data/settings.json
 */
export function getSettingsFilePath() {
  if (process.env.SETTINGS_FILE) {
    return {
      dir: path.dirname(process.env.SETTINGS_FILE),
      file: process.env.SETTINGS_FILE
    }
  }

  const baseDir = process.env.DATA_DIR || path.join(process.cwd(), 'data')
  return {
    dir: baseDir,
    file: path.join(baseDir, 'settings.json')
  }
}

/**
 * Membaca pengaturan website dari file settings.json.
 * Jika file belum ada, otomatis membuat direktori dan file default.
 */
export async function readSiteSettings(): Promise<SiteSettings> {
  const { dir, file } = getSettingsFilePath()

  try {
    if (!existsSync(file)) {
      await fs.mkdir(dir, { recursive: true })
      const initial: SiteSettings = {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString()
      }
      await fs.writeFile(file, JSON.stringify(initial, null, 2), 'utf-8')
      return initial
    }

    const content = await fs.readFile(file, 'utf-8')
    const parsed = JSON.parse(content)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed
    }
  } catch (err) {
    console.error('[SettingsStorage] Gagal membaca settings.json, menggunakan default:', err)
    return { ...DEFAULT_SETTINGS }
  }
}

/**
 * Menyimpan pembaruan pengaturan website ke file settings.json secara atomic.
 */
export async function writeSiteSettings(newSettings: Partial<SiteSettings>): Promise<SiteSettings> {
  const { dir, file } = getSettingsFilePath()
  const current = await readSiteSettings()

  const updated: SiteSettings = {
    ...current,
    ...newSettings,
    appName: (newSettings.appName !== undefined ? newSettings.appName : current.appName || 'Pekerja48').trim(),
    isStreamEnabled: typeof newSettings.isStreamEnabled === 'boolean' ? newSettings.isStreamEnabled : current.isStreamEnabled,
    isReplayEnabled: typeof newSettings.isReplayEnabled === 'boolean' ? newSettings.isReplayEnabled : current.isReplayEnabled,
    streamNotice: typeof newSettings.streamNotice === 'string' ? newSettings.streamNotice.trim() : current.streamNotice,
    replayNotice: typeof newSettings.replayNotice === 'string' ? newSettings.replayNotice.trim() : current.replayNotice,
    updatedAt: new Date().toISOString()
  }

  await fs.mkdir(dir, { recursive: true })
  const tempFile = `${file}.tmp.${Date.now()}`
  await fs.writeFile(tempFile, JSON.stringify(updated, null, 2), 'utf-8')
  await fs.rename(tempFile, file)

  return updated
}
