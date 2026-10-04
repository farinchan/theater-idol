import { writeSiteSettings, SiteSettings } from '../utils/settingsStorage'
import { requireAdminUser } from '../utils/authGuard'

export default defineEventHandler(async (event) => {
  // Wajibkan hak akses admin untuk mengubah konfigurasi website
  await requireAdminUser(event)

  const body = await readBody<Partial<SiteSettings>>(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body tidak boleh kosong'
    })
  }

  if (body.appName !== undefined && !body.appName.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nama website tidak boleh kosong'
    })
  }

  const updated = await writeSiteSettings(body)

  return {
    success: true,
    settings: updated
  }
})
