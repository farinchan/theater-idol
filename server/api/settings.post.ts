import { writeSiteSettings, SiteSettings } from '../utils/settingsStorage'

export default defineEventHandler(async (event) => {
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
