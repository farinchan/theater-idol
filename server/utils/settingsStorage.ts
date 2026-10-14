import { promises as fs, existsSync } from 'node:fs'
import path from 'node:path'
import { Client, TablesDB } from 'appwrite'

export interface SiteSettings {
  appName: string
  isStreamEnabled: boolean
  isReplayEnabled: boolean
  isStreamRequireLogin: boolean
  isReplayRequireLogin: boolean
  isStreamRequirePremium: boolean
  isReplayRequirePremium: boolean
  streamNotice?: string
  replayNotice?: string
  whatsappChannel?: string
  updatedAt: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  appName: 'Theater Idol',
  isStreamEnabled: true,
  isReplayEnabled: true,
  isStreamRequireLogin: false,
  isReplayRequireLogin: false,
  isStreamRequirePremium: false,
  isReplayRequirePremium: false,
  streamNotice: 'Fitur Live Stream saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.',
  replayNotice: 'Fitur Arsip Replay saat ini sedang ditutup atau dinonaktifkan sementara oleh administrator.',
  whatsappChannel: '',
  updatedAt: new Date().toISOString()
}

/**
 * Menentukan path file backup settings.json
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
 * Inisialisasi client TablesDB Appwrite untuk server dengan API Key
 */
export function getAppwriteTablesDB() {
  const config = useRuntimeConfig()
  const endpoint = config.public.appwriteEndpoint || 'https://sgp.cloud.appwrite.io/v1'
  const projectId = config.public.appwriteProjectId || ''
  const dbId = (config.public.appwriteDatabaseId as string) || ''

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)

  if (config.appwriteApiKey) {
    (client as any).headers['X-Appwrite-Key'] = config.appwriteApiKey
  }

  const tablesDB = new TablesDB(client)
  return { tablesDB, dbId }
}

/**
 * Membaca pengaturan website 100% dari Appwrite Database (tabel `settings`, row `global_settings`)
 */
export async function readSiteSettings(): Promise<SiteSettings> {
  try {
    const { tablesDB, dbId } = getAppwriteTablesDB()
    let row: any = null

    try {
      row = await tablesDB.getRow(dbId, 'settings', 'global_settings')
    } catch {
      const rowsRes = await tablesDB.listRows(dbId, 'settings')
      if (rowsRes.total > 0 && rowsRes.rows[0]) {
        row = rowsRes.rows[0]
      }
    }

    if (row) {
      let localBackup: any = null
      try {
        const { file } = getSettingsFilePath()
        if (existsSync(file)) {
          const raw = await fs.readFile(file, 'utf-8')
          localBackup = JSON.parse(raw)
        }
      } catch {}

      return {
        appName: row.app_name || DEFAULT_SETTINGS.appName,
        isStreamEnabled: row.is_stream_enabled !== undefined ? Boolean(row.is_stream_enabled) : DEFAULT_SETTINGS.isStreamEnabled,
        isReplayEnabled: row.is_replay_enabled !== undefined ? Boolean(row.is_replay_enabled) : DEFAULT_SETTINGS.isReplayEnabled,
        isStreamRequireLogin: row.is_stream_require_login !== undefined ? Boolean(row.is_stream_require_login) : DEFAULT_SETTINGS.isStreamRequireLogin,
        isReplayRequireLogin: row.is_replay_require_login !== undefined ? Boolean(row.is_replay_require_login) : DEFAULT_SETTINGS.isReplayRequireLogin,
        isStreamRequirePremium: row.is_stream_require_premium !== undefined ? Boolean(row.is_stream_require_premium) : DEFAULT_SETTINGS.isStreamRequirePremium,
        isReplayRequirePremium: row.is_replay_require_premium !== undefined ? Boolean(row.is_replay_require_premium) : DEFAULT_SETTINGS.isReplayRequirePremium,
        streamNotice: row.stream_notice || DEFAULT_SETTINGS.streamNotice,
        replayNotice: row.replay_notice || DEFAULT_SETTINGS.replayNotice,
        whatsappChannel: row.whatsapp_channel !== undefined ? row.whatsapp_channel : (localBackup?.whatsappChannel || DEFAULT_SETTINGS.whatsappChannel),
        updatedAt: row.updated_at || row.$updatedAt || DEFAULT_SETTINGS.updatedAt
      }
    }
  } catch (err: any) {
    console.error('[SettingsStorage] Gagal membaca dari Appwrite Database:', err?.message)
  }

  // Fallback ke file lokal jika database belum tersedia
  try {
    const { file } = getSettingsFilePath()
    if (existsSync(file)) {
      const raw = await fs.readFile(file, 'utf-8')
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_SETTINGS,
        ...parsed
      }
    }
  } catch {}

  return { ...DEFAULT_SETTINGS }
}

/**
 * Menyimpan pembaruan pengaturan website 100% ke Appwrite Database (tabel `settings`, row `global_settings`)
 */
export async function writeSiteSettings(newSettings: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await readSiteSettings()

  const updated: SiteSettings = {
    ...current,
    ...newSettings,
    appName: (newSettings.appName !== undefined ? newSettings.appName : current.appName || 'Theater Idol').trim(),
    isStreamEnabled: typeof newSettings.isStreamEnabled === 'boolean' ? newSettings.isStreamEnabled : current.isStreamEnabled,
    isReplayEnabled: typeof newSettings.isReplayEnabled === 'boolean' ? newSettings.isReplayEnabled : current.isReplayEnabled,
    isStreamRequireLogin: typeof newSettings.isStreamRequireLogin === 'boolean' ? newSettings.isStreamRequireLogin : current.isStreamRequireLogin,
    isReplayRequireLogin: typeof newSettings.isReplayRequireLogin === 'boolean' ? newSettings.isReplayRequireLogin : current.isReplayRequireLogin,
    isStreamRequirePremium: typeof newSettings.isStreamRequirePremium === 'boolean' ? newSettings.isStreamRequirePremium : current.isStreamRequirePremium,
    isReplayRequirePremium: typeof newSettings.isReplayRequirePremium === 'boolean' ? newSettings.isReplayRequirePremium : current.isReplayRequirePremium,
    streamNotice: typeof newSettings.streamNotice === 'string' ? newSettings.streamNotice.trim() : current.streamNotice,
    replayNotice: typeof newSettings.replayNotice === 'string' ? newSettings.replayNotice.trim() : current.replayNotice,
    whatsappChannel: typeof newSettings.whatsappChannel === 'string' ? newSettings.whatsappChannel.trim() : (current.whatsappChannel || ''),
    updatedAt: new Date().toISOString()
  }

  // Simpan salinan lokal ke data/settings.json agar tetap persisten
  try {
    const { dir, file } = getSettingsFilePath()
    await fs.mkdir(dir, { recursive: true })
    const tempFile = `${file}.tmp.${Date.now()}`
    await fs.writeFile(tempFile, JSON.stringify(updated, null, 2), 'utf-8')
    await fs.rename(tempFile, file)
  } catch (backupErr: any) {
    console.warn('[SettingsStorage] Gagal menulis backup lokal settings.json:', backupErr?.message)
  }

  try {
    const { tablesDB, dbId } = getAppwriteTablesDB()
    const payload: any = {
      app_name: updated.appName,
      is_stream_enabled: updated.isStreamEnabled,
      is_replay_enabled: updated.isReplayEnabled,
      is_stream_require_login: updated.isStreamRequireLogin,
      is_replay_require_login: updated.isReplayRequireLogin,
      is_stream_require_premium: updated.isStreamRequirePremium,
      is_replay_require_premium: updated.isReplayRequirePremium,
      stream_notice: updated.streamNotice || '',
      replay_notice: updated.replayNotice || '',
      whatsapp_channel: updated.whatsappChannel || '',
      updated_at: updated.updatedAt
    }

    try {
      await tablesDB.updateRow(dbId, 'settings', 'global_settings', payload)
    } catch (updateErr: any) {
      // Jika kolom whatsapp_channel belum terdaftar di skema Appwrite, simpan kolom lainnya
      if (updateErr?.message?.includes('whatsapp_channel') || updateErr?.message?.includes('Unknown attribute')) {
        const fallbackPayload = { ...payload }
        delete fallbackPayload.whatsapp_channel
        try {
          await tablesDB.updateRow(dbId, 'settings', 'global_settings', fallbackPayload)
        } catch {
          await tablesDB.createRow(dbId, 'settings', 'global_settings', fallbackPayload)
        }
      } else {
        try {
          await tablesDB.createRow(dbId, 'settings', 'global_settings', payload)
        } catch (createErr: any) {
          if (createErr?.message?.includes('whatsapp_channel') || createErr?.message?.includes('Unknown attribute')) {
            const fallbackPayload = { ...payload }
            delete fallbackPayload.whatsapp_channel
            await tablesDB.createRow(dbId, 'settings', 'global_settings', fallbackPayload)
          } else {
            throw createErr
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[SettingsStorage] Gagal menyimpan ke Appwrite Database:', err?.message)
  }

  return updated
}
